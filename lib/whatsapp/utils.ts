import type { proto, WAMessage } from '@whiskeysockets/baileys';

export function sanitizeUserPathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function extractMessageText(message?: proto.IMessage | null): string {
  if (!message) return '';

  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.documentMessage?.caption) return message.documentMessage.caption;
  if (message.buttonsResponseMessage?.selectedDisplayText) return message.buttonsResponseMessage.selectedDisplayText;
  if (message.listResponseMessage?.title) return message.listResponseMessage.title;
  if (message.templateButtonReplyMessage?.selectedDisplayText) return message.templateButtonReplyMessage.selectedDisplayText;
  if (message.interactiveResponseMessage) return 'Interactive response';

  return '';
}

export function detectMessageType(message?: proto.IMessage | null): string {
  if (!message) return 'unknown';
  const firstKey = Object.keys(message)[0];
  return firstKey || 'unknown';
}

type NumericTimestamp = number | { toNumber(): number } | null | undefined;

export function normalizeTimestamp(value: NumericTimestamp): Date {
  if (!value) return new Date();
  const numeric = typeof value === 'object' && 'toNumber' in value ? value.toNumber() : Number(value);
  if (!Number.isFinite(numeric)) return new Date();
  return numeric > 10_000_000_000 ? new Date(numeric) : new Date(numeric * 1000);
}

export function getChatJid(message: WAMessage): string {
  return message.key.remoteJid || message.key.participant || '';
}
