import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/current-user';
import { whatsappSessionManager } from '@/lib/whatsapp/session-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const chats = await whatsappSessionManager.listChats(user.id);
    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WhatsApp chats' },
      { status: 500 }
    );
  }
}
