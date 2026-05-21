import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/current-user';
import { whatsappSessionManager } from '@/lib/whatsapp/session-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  await whatsappSessionManager.ensureSession(user.id).catch(() => null);
  return NextResponse.json(whatsappSessionManager.getStatus(user.id));
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    await whatsappSessionManager.ensureSession(user.id);
    return NextResponse.json(whatsappSessionManager.getStatus(user.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start WhatsApp session' },
      { status: 500 }
    );
  }
}
