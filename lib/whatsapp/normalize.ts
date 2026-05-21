import type { WAMessage } from '@whiskeysockets/baileys';
import type { WhatsAppMessageRecord } from '@/lib/whatsapp/types';
import { detectMessageType, extractMessageText, getChatJid, normalizeTimestamp } from '@/lib/whatsapp/utils';

export function normalizeBaileysMessage(message: WAMessage): WhatsAppMessageRecord {
  const content = message.message;
  const type = detectMessageType(content);
  const timestamp = normalizeTimestamp(message.messageTimestamp).toISOString();
  const chatJid = getChatJid(message);

  return {
    messageId: message.key.id || `${chatJid}-${timestamp}`,
    chatJid,
    senderJid: message.key.participant || message.key.remoteJid || null,
    pushName: message.pushName || null,
    fromMe: !!message.key.fromMe,
    text: extractMessageText(content),
    type,
    timestamp,
    status: message.key.fromMe ? 'sent' : 'received',
    mediaMimeType:
      content?.imageMessage?.mimetype ||
      content?.videoMessage?.mimetype ||
      content?.audioMessage?.mimetype ||
      content?.documentMessage?.mimetype ||
      null,
    fileName: content?.documentMessage?.fileName || null,
    quotedMessageId: content?.extendedTextMessage?.contextInfo?.stanzaId || null,
  };
}
