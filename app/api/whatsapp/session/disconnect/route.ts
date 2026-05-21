import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/current-user';
import { whatsappSessionManager } from '@/lib/whatsapp/session-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    await whatsappSessionManager.disconnect(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect WhatsApp session' },
      { status: 500 }
    );
  }
}
