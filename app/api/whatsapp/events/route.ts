import { getCurrentUser } from '@/lib/server/current-user';
import { whatsappEventBus } from '@/lib/whatsapp/event-bus';
import { whatsappSessionManager } from '@/lib/whatsapp/session-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const user = await getCurrentUser();
  await whatsappSessionManager.ensureSession(user.id).catch(() => null);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (eventName: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      send('status', whatsappSessionManager.getStatus(user.id));

      const unsubscribe = whatsappEventBus.subscribe(user.id, (event) => {
        send(event.type, event.payload);
      });

      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(ping);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
