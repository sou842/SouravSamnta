import { cookies, headers } from 'next/headers';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
}

const DEV_FALLBACK_USER_ID = process.env.WHATSAPP_DEV_USER_ID || process.env.DEMO_USER_ID || 'local-user';

const normalize = (value: string) => value.trim().replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);

export async function getCurrentUser(): Promise<AppUser> {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const rawId =
    headerStore.get('x-user-id') ||
    headerStore.get('x-demo-user-id') ||
    cookieStore.get('demo_user_id')?.value ||
    DEV_FALLBACK_USER_ID;

  const userId = normalize(rawId || DEV_FALLBACK_USER_ID);

  return {
    id: userId,
    email:
      headerStore.get('x-user-email') ||
      cookieStore.get('demo_user_email')?.value ||
      undefined,
    name:
      headerStore.get('x-user-name') ||
      cookieStore.get('demo_user_name')?.value ||
      undefined,
  };
}
