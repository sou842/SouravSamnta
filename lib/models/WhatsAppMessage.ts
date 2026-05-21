import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  userId: string;
  chatJid: string;
  messageId: string;
  senderJid?: string;
  pushName?: string;
  fromMe: boolean;
  text: string;
  type: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'received' | 'error';
  messageTimestamp?: Date;
  mediaUrl?: string;
  mediaMimeType?: string;
  fileName?: string;
  quotedMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    userId: { type: String, required: true, index: true },
    chatJid: { type: String, required: true, index: true },
    messageId: { type: String, required: true },
    senderJid: String,
    pushName: String,
    fromMe: { type: Boolean, default: false },
    text: { type: String, default: '' },
    type: { type: String, default: 'text' },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'received', 'error'],
      default: 'received',
    },
    messageTimestamp: Date,
    mediaUrl: String,
    mediaMimeType: String,
    fileName: String,
    quotedMessageId: String,
  },
  { timestamps: true }
);

WhatsAppMessageSchema.index({ userId: 1, messageId: 1 }, { unique: true });
WhatsAppMessageSchema.index({ userId: 1, chatJid: 1, messageTimestamp: -1 });

export default mongoose.models.WhatsAppMessage || mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
