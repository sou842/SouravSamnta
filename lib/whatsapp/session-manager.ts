import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidGroup,
  useMultiFileAuthState,
  type ConnectionState,
  type WAMessage,
  type WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import dbConnect from '@/lib/mongodb';
import WhatsAppChat from '@/lib/models/WhatsAppChat';
import WhatsAppMessage from '@/lib/models/WhatsAppMessage';
import type { WhatsAppChatSummary, WhatsAppConnectionStatus, WhatsAppMessageRecord, WhatsAppStatusPayload } from '@/lib/whatsapp/types';
import { whatsappEventBus } from '@/lib/whatsapp/event-bus';
import { normalizeBaileysMessage } from '@/lib/whatsapp/normalize';
import {
  clearPersistedSession,
  getUserSessionDir,
  hasPersistedSession,
  upsertChatSummary,
  upsertMessageRecord,
  upsertSessionRecord,
} from '@/lib/whatsapp/storage';

const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || 'silent' });
const RECONNECT_DELAY_MS = 3_000;

interface ManagedSession {
  userId: string;
  socket: WASocket | null;
  status: WhatsAppConnectionStatus;
  qrCodeDataUrl: string | null;
  phoneNumber: string | null;
  pushName: string | null;
  lastError: string | null;
  connectedAt: string | null;
  reconnectTimer: NodeJS.Timeout | null;
  version: number;
  booting: Promise<ManagedSession> | null;
}

class WhatsAppSessionManager {
  private sessions = new Map<string, ManagedSession>();

  async ensureSession(userId: string) {
    const existing = this.getOrCreateSession(userId);
    if (existing.socket) return existing;
    if (existing.booting) return existing.booting;

    existing.booting = this.connect(userId)
      .then((session) => session)
      .finally(() => {
        existing.booting = null;
      });

    return existing.booting;
  }

  getStatus(userId: string): WhatsAppStatusPayload {
    const session = this.getOrCreateSession(userId);
    return {
      status: session.status,
      qrCodeDataUrl: session.qrCodeDataUrl,
      phoneNumber: session.phoneNumber,
      pushName: session.pushName,
      lastError: session.lastError,
      connectedAt: session.connectedAt,
      updatedAt: new Date().toISOString(),
    };
  }

  async disconnect(userId: string) {
    const session = this.getOrCreateSession(userId);
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }

    try {
      await session.socket?.logout();
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to logout WhatsApp socket cleanly');
    }

    try {
      session.socket?.end(undefined);
    } catch {
      // noop
    }

    session.socket = null;
    session.qrCodeDataUrl = null;
    session.status = 'disconnected';
    session.connectedAt = null;
    session.phoneNumber = null;
    session.pushName = null;
    session.lastError = null;

    await clearPersistedSession(userId);
    await upsertSessionRecord({ userId, status: 'disconnected' });
    whatsappEventBus.emit(userId, 'session.cleared', this.getStatus(userId));
  }

  async sendMessage(
    userId: string,
    payload:
      | { chatJid: string; text: string; quotedMessageId?: string }
      | { chatJid: string; mediaUrl: string; mediaType: 'image' | 'document' | 'audio'; mimeType?: string; fileName?: string; caption?: string; quotedMessageId?: string }
  ) {
    const session = await this.ensureSession(userId);
    if (!session.socket) {
      throw new Error('WhatsApp session is not connected');
    }

    await dbConnect();
    const quoted = payload.quotedMessageId
      ? await WhatsAppMessage.findOne({ userId, messageId: payload.quotedMessageId }).lean()
      : null;

    let message: any;
    if ('text' in payload) {
      message = { text: payload.text };
    } else {
      const response = await fetch(payload.mediaUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch media from the provided URL');
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (payload.mediaType === 'image') {
        message = { image: buffer, caption: payload.caption, mimetype: payload.mimeType };
      } else if (payload.mediaType === 'audio') {
        message = { audio: buffer, mimetype: payload.mimeType || 'audio/mpeg', ptt: false };
      } else {
        message = {
          document: buffer,
          fileName: payload.fileName || 'attachment',
          mimetype: payload.mimeType || 'application/octet-stream',
          caption: payload.caption,
        };
      }
    }

    const sent = await session.socket.sendMessage(payload.chatJid, message, quoted ? { quoted: { key: { remoteJid: quoted.chatJid, id: quoted.messageId, fromMe: quoted.fromMe } } as any } : undefined);
    const normalized = normalizeBaileysMessage(sent as WAMessage);
    normalized.status = 'sent';
    await upsertMessageRecord(userId, normalized);
    await upsertChatSummary({
      userId,
      jid: normalized.chatJid,
      name: normalized.chatJid,
      lastMessageText: normalized.text,
      lastMessageAt: new Date(normalized.timestamp),
      isGroup: normalized.chatJid.endsWith('@g.us'),
    });

    whatsappEventBus.emit(userId, 'message.upsert', normalized);
    return normalized;
  }

  async listChats(userId: string): Promise<WhatsAppChatSummary[]> {
    await dbConnect();
    const chats = await WhatsAppChat.find({ userId }).sort({ lastMessageAt: -1, updatedAt: -1 }).lean();
    return chats.map((chat) => ({
      jid: chat.jid,
      name: chat.name || chat.jid,
      lastMessageText: chat.lastMessageText || '',
      lastMessageAt: chat.lastMessageAt?.toISOString() || null,
      unreadCount: chat.unreadCount || 0,
      isGroup: !!chat.isGroup,
      avatarUrl: chat.avatarUrl || null,
    }));
  }

  async listMessages(userId: string, chatJid: string, limit = 100): Promise<WhatsAppMessageRecord[]> {
    await dbConnect();
    const messages = await WhatsAppMessage.find({ userId, chatJid })
      .sort({ messageTimestamp: -1, createdAt: -1 })
      .limit(Math.min(limit, 200))
      .lean();

    return messages.reverse().map((message) => ({
      messageId: message.messageId,
      chatJid: message.chatJid,
      senderJid: message.senderJid || null,
      pushName: message.pushName || null,
      fromMe: message.fromMe,
      text: message.text || '',
      type: message.type,
      timestamp: message.messageTimestamp?.toISOString() || message.createdAt.toISOString(),
      status: message.status,
      mediaUrl: message.mediaUrl || null,
      mediaMimeType: message.mediaMimeType || null,
      fileName: message.fileName || null,
      quotedMessageId: message.quotedMessageId || null,
    }));
  }

  private getOrCreateSession(userId: string): ManagedSession {
    const existing = this.sessions.get(userId);
    if (existing) return existing;

    const created: ManagedSession = {
      userId,
      socket: null,
      status: 'idle',
      qrCodeDataUrl: null,
      phoneNumber: null,
      pushName: null,
      lastError: null,
      connectedAt: null,
      reconnectTimer: null,
      version: 0,
      booting: null,
    };

    this.sessions.set(userId, created);
    return created;
  }

  private async connect(userId: string) {
    const session = this.getOrCreateSession(userId);
    session.version += 1;
    const version = session.version;
    session.status = session.socket ? 'reconnecting' : 'initializing';
    session.lastError = null;
    this.emitStatus(userId);

    const authDir = await getUserSessionDir(userId);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version: latestVersion } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version: latestVersion,
      auth: state,
      browser: Browsers.macOS('Jarvis AI'),
      logger,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    session.socket = socket;

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(userId, version, update);
    });
    socket.ev.on('messages.upsert', async ({ messages }) => {
      await this.handleMessages(userId, messages || []);
    });
    socket.ev.on('messages.update', async (updates) => {
      await this.handleMessageUpdates(userId, updates || []);
    });
    socket.ev.on('chats.upsert', async (chats) => {
      await Promise.all(
        (chats || []).flatMap((chat) => {
          if (!chat.id) return [];
          return [
            upsertChatSummary({
              userId,
              jid: chat.id,
              name: chat.name || chat.id,
              lastMessageAt: chat.conversationTimestamp ? new Date(Number(chat.conversationTimestamp) * 1000) : undefined,
              unreadCount: chat.unreadCount ?? 0,
              isGroup: isJidGroup(chat.id),
            }),
          ];
        })
      );
      whatsappEventBus.emit(userId, 'chat.upsert', await this.listChats(userId));
    });
    socket.ev.on('presence.update', (presence) => {
      whatsappEventBus.emit(userId, 'presence.update', presence);
    });

    const persisted = await hasPersistedSession(userId);
    if (persisted && session.status === 'initializing') {
      session.status = 'reconnecting';
      this.emitStatus(userId);
    }

    return session;
  }

  private async handleConnectionUpdate(userId: string, version: number, update: Partial<ConnectionState>) {
    const session = this.getOrCreateSession(userId);
    if (session.version !== version) return;

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.status = 'qr_pending';
      session.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 280 });
      this.emitStatus(userId);
      whatsappEventBus.emit(userId, 'qr', { qrCodeDataUrl: session.qrCodeDataUrl });
    }

    if (connection === 'open') {
      const me = session.socket?.user;
      session.status = 'connected';
      session.qrCodeDataUrl = null;
      session.phoneNumber = me?.id?.split(':')[0] || me?.id?.split('@')[0] || null;
      session.pushName = me?.name || null;
      session.connectedAt = new Date().toISOString();
      session.lastError = null;
      await upsertSessionRecord({
        userId,
        status: 'connected',
        phoneNumber: session.phoneNumber,
        pushName: session.pushName,
        connectedAt: new Date(session.connectedAt),
      });
      this.emitStatus(userId);
      return;
    }

    if (connection === 'close') {
      const statusCode = Number((lastDisconnect?.error as any)?.output?.statusCode || (lastDisconnect?.error as any)?.data?.statusCode || 0);
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      session.socket = null;
      session.qrCodeDataUrl = null;
      session.lastError = (lastDisconnect?.error as Error | undefined)?.message || null;
      session.status = isLoggedOut ? 'logged_out' : 'disconnected';
      await upsertSessionRecord({
        userId,
        status: session.status,
        phoneNumber: session.phoneNumber,
        pushName: session.pushName,
        lastError: session.lastError,
      });
      this.emitStatus(userId);

      if (isLoggedOut) {
        await clearPersistedSession(userId);
        return;
      }

      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
      }

      session.status = 'reconnecting';
      this.emitStatus(userId);
      session.reconnectTimer = setTimeout(() => {
        void this.connect(userId);
      }, RECONNECT_DELAY_MS);
    }
  }

  private async handleMessages(userId: string, messages: WAMessage[]) {
    for (const message of messages) {
      if (!message.key.remoteJid) continue;
      const normalized = normalizeBaileysMessage(message);
      await upsertMessageRecord(userId, normalized);
      await upsertChatSummary({
        userId,
        jid: normalized.chatJid,
        name: normalized.pushName || normalized.chatJid,
        lastMessageText: normalized.text,
        lastMessageAt: new Date(normalized.timestamp),
        unreadCount: normalized.fromMe ? 0 : 1,
        isGroup: normalized.chatJid.endsWith('@g.us'),
      });
      whatsappEventBus.emit(userId, 'message.upsert', normalized);
    }

    whatsappEventBus.emit(userId, 'chat.upsert', await this.listChats(userId));
  }

  private async handleMessageUpdates(
    userId: string,
    updates: Array<{ key?: { id?: string | null }; update?: { status?: number | null } }>
  ) {
    for (const entry of updates) {
      if (!entry.key?.id) continue;
      const status = this.mapBaileysAck(entry.update?.status);
      if (!status) continue;

      await dbConnect();
      const updated = await WhatsAppMessage.findOneAndUpdate(
        { userId, messageId: entry.key.id },
        { $set: { status } },
        { new: true }
      ).lean();

      if (!updated) continue;
      const payload: WhatsAppMessageRecord = {
        messageId: updated.messageId,
        chatJid: updated.chatJid,
        senderJid: updated.senderJid || null,
        pushName: updated.pushName || null,
        fromMe: updated.fromMe,
        text: updated.text,
        type: updated.type,
        timestamp: updated.messageTimestamp?.toISOString() || updated.createdAt.toISOString(),
        status: updated.status,
        mediaUrl: updated.mediaUrl || null,
        mediaMimeType: updated.mediaMimeType || null,
        fileName: updated.fileName || null,
        quotedMessageId: updated.quotedMessageId || null,
      };
      whatsappEventBus.emit(userId, 'message.update', payload);
    }
  }

  private mapBaileysAck(status?: number | null) {
    if (status == null) return null;
    if (status >= 4) return 'read' as const;
    if (status === 3) return 'delivered' as const;
    if (status >= 1) return 'sent' as const;
    return 'pending' as const;
  }

  private emitStatus(userId: string) {
    const payload = this.getStatus(userId);
    void upsertSessionRecord({
      userId,
      status: payload.status,
      phoneNumber: payload.phoneNumber,
      pushName: payload.pushName,
      lastError: payload.lastError,
      connectedAt: payload.connectedAt ? new Date(payload.connectedAt) : null,
    });
    whatsappEventBus.emit(userId, 'status', payload);
  }
}

const globalForWhatsApp = globalThis as typeof globalThis & {
  __whatsappSessionManager?: WhatsAppSessionManager;
};

export const whatsappSessionManager = globalForWhatsApp.__whatsappSessionManager || new WhatsAppSessionManager();

if (!globalForWhatsApp.__whatsappSessionManager) {
  globalForWhatsApp.__whatsappSessionManager = whatsappSessionManager;
}
