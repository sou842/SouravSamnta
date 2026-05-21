export type WhatsAppConnectionStatus =
  | 'idle'
  | 'initializing'
  | 'qr_pending'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'logged_out'
  | 'session_expired'
  | 'error';

export type WhatsAppStreamEventType =
  | 'status'
  | 'qr'
  | 'message.upsert'
  | 'message.update'
  | 'chat.upsert'
  | 'presence.update'
  | 'session.cleared';

export interface WhatsAppStatusPayload {
  status: WhatsAppConnectionStatus;
  qrCodeDataUrl?: string | null;
  phoneNumber?: string | null;
  pushName?: string | null;
  lastError?: string | null;
  connectedAt?: string | null;
  updatedAt: string;
}

export interface WhatsAppStreamEvent<T = unknown> {
  type: WhatsAppStreamEventType;
  userId: string;
  payload: T;
  timestamp: string;
}

export interface WhatsAppChatSummary {
  jid: string;
  name: string;
  lastMessageText: string;
  lastMessageAt: string | null;
  unreadCount: number;
  isGroup: boolean;
  avatarUrl?: string | null;
}

export interface WhatsAppMessageRecord {
  messageId: string;
  chatJid: string;
  senderJid?: string | null;
  pushName?: string | null;
  fromMe: boolean;
  text: string;
  type: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'received' | 'error';
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  fileName?: string | null;
  quotedMessageId?: string | null;
}
