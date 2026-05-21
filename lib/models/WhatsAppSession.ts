import mongoose, { Document, Schema } from 'mongoose';
import type { WhatsAppConnectionStatus } from '@/lib/whatsapp/types';

export interface IWhatsAppSession extends Document {
  userId: string;
  status: WhatsAppConnectionStatus;
  phoneNumber?: string;
  pushName?: string;
  lastError?: string;
  connectedAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['idle', 'initializing', 'qr_pending', 'connected', 'reconnecting', 'disconnected', 'logged_out', 'session_expired', 'error'],
      default: 'idle',
    },
    phoneNumber: String,
    pushName: String,
    lastError: String,
    connectedAt: Date,
    lastSeenAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.WhatsAppSession || mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema);
