import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppChat extends Document {
  userId: string;
  jid: string;
  name: string;
  lastMessageText: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isGroup: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppChatSchema = new Schema<IWhatsAppChat>(
  {
    userId: { type: String, required: true, index: true },
    jid: { type: String, required: true },
    name: { type: String, default: '' },
    lastMessageText: { type: String, default: '' },
    lastMessageAt: Date,
    unreadCount: { type: Number, default: 0 },
    isGroup: { type: Boolean, default: false },
    avatarUrl: String,
  },
  { timestamps: true }
);

WhatsAppChatSchema.index({ userId: 1, jid: 1 }, { unique: true });
WhatsAppChatSchema.index({ userId: 1, lastMessageAt: -1 });

export default mongoose.models.WhatsAppChat || mongoose.model<IWhatsAppChat>('WhatsAppChat', WhatsAppChatSchema);
