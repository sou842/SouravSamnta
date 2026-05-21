import { EventEmitter } from 'events';
import type { WhatsAppStreamEvent, WhatsAppStreamEventType } from '@/lib/whatsapp/types';

class WhatsAppEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(200);
  }

  emit<T>(userId: string, type: WhatsAppStreamEventType, payload: T) {
    const event: WhatsAppStreamEvent<T> = {
      type,
      userId,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.emitter.emit(this.eventName(userId), event);
  }

  subscribe(userId: string, listener: (event: WhatsAppStreamEvent) => void) {
    const name = this.eventName(userId);
    this.emitter.on(name, listener);
    return () => this.emitter.off(name, listener);
  }

  private eventName(userId: string) {
    return `whatsapp:${userId}`;
  }
}

const globalForWhatsAppEvents = globalThis as typeof globalThis & {
  __whatsappEventBus?: WhatsAppEventBus;
};

export const whatsappEventBus = globalForWhatsAppEvents.__whatsappEventBus || new WhatsAppEventBus();

if (!globalForWhatsAppEvents.__whatsappEventBus) {
  globalForWhatsAppEvents.__whatsappEventBus = whatsappEventBus;
}
