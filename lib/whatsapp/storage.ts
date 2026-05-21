import { promises as fs } from 'fs';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import WhatsAppChat from '@/lib/models/WhatsAppChat';
import WhatsAppMessage from '@/lib/models/WhatsAppMessage';
import WhatsAppSession from '@/lib/models/WhatsAppSession';
import type { WhatsAppConnectionStatus, WhatsAppMessageRecord } from '@/lib/whatsapp/types';
import { sanitizeUserPathSegment } from '@/lib/whatsapp/utils';

const sessionsRoot = path.join(process.cwd(), 'sessions');

export async function ensureSessionsRoot() {
  await fs.mkdir(sessionsRoot, { recursive: true });
}

export async function getUserSessionDir(userId: string) {
  await ensureSessionsRoot();
  const dir = path.join(sessionsRoot, sanitizeUserPathSegment(userId));
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function hasPersistedSession(userId: string) {
  const dir = await getUserSessionDir(userId);
  try {
    const files = await fs.readdir(dir);
    return files.length > 0;
  } catch {
    return false;
  }
}

export async function clearPersistedSession(userId: string) {
  const dir = await getUserSessionDir(userId);
  await fs.rm(dir, { recursive: true, force: true });
}

export async function upsertSessionRecord(input: {
  userId: string;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string | null;
  pushName?: string | null;
  lastError?: string | null;
  connectedAt?: Date | null;
}) {
  await dbConnect();
  await WhatsAppSession.updateOne(
    { userId: input.userId },
    {
      $set: {
        status: input.status,
        phoneNumber: input.phoneNumber || undefined,
        pushName: input.pushName || undefined,
        lastError: input.lastError || undefined,
        connectedAt: input.connectedAt || undefined,
        lastSeenAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function upsertChatSummary(input: {
  userId: string;
  jid: string;
  name?: string | null;
  lastMessageText?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
  isGroup?: boolean;
}) {
  await dbConnect();
  await WhatsAppChat.updateOne(
    { userId: input.userId, jid: input.jid },
    {
      $set: {
        name: input.name || input.jid,
        lastMessageText: input.lastMessageText || '',
        lastMessageAt: input.lastMessageAt,
        unreadCount: input.unreadCount ?? 0,
        isGroup: input.isGroup ?? false,
      },
    },
    { upsert: true }
  );
}

export async function upsertMessageRecord(userId: string, message: WhatsAppMessageRecord) {
  await dbConnect();
  await WhatsAppMessage.updateOne(
    { userId, messageId: message.messageId },
    {
      $set: {
        chatJid: message.chatJid,
        senderJid: message.senderJid || undefined,
        pushName: message.pushName || undefined,
        fromMe: message.fromMe,
        text: message.text,
        type: message.type,
        status: message.status,
        messageTimestamp: new Date(message.timestamp),
        mediaUrl: message.mediaUrl || undefined,
        mediaMimeType: message.mediaMimeType || undefined,
        fileName: message.fileName || undefined,
        quotedMessageId: message.quotedMessageId || undefined,
      },
    },
    { upsert: true }
  );
}
