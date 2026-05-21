import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/current-user';
import { whatsappSessionManager } from '@/lib/whatsapp/session-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sendSchema = z.object({
  chatJid: z.string().min(1),
  text: z.string().min(1).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'document', 'audio']).optional(),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
  caption: z.string().optional(),
  quotedMessageId: z.string().optional(),
}).refine((value) => value.text || (value.mediaUrl && value.mediaType), {
  message: 'Provide either text or media payload',
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const chatJid = searchParams.get('chatJid');
    const limit = Number(searchParams.get('limit') || '100');

    if (!chatJid) {
      return NextResponse.json({ error: 'chatJid is required' }, { status: 400 });
    }

    const messages = await whatsappSessionManager.listMessages(user.id, chatJid, limit);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WhatsApp messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = sendSchema.parse(await req.json());
    const message = body.text
      ? await whatsappSessionManager.sendMessage(user.id, {
          chatJid: body.chatJid,
          text: body.text,
          quotedMessageId: body.quotedMessageId,
        })
      : await whatsappSessionManager.sendMessage(user.id, {
          chatJid: body.chatJid,
          mediaUrl: body.mediaUrl!,
          mediaType: body.mediaType!,
          mimeType: body.mimeType,
          fileName: body.fileName,
          caption: body.caption,
          quotedMessageId: body.quotedMessageId,
        });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
