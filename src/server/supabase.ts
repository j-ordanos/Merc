import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requiredEnv } from './config';
import { AppError } from './errors';
export async function supabase() {
  const jar = await cookies();
  return createServerClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (updates) => {
          try {
            updates.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            /* Server components rely on proxy refresh. */
          }
        },
      },
    },
  );
}
export function adminDb() {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function requireUser() {
  const db = await supabase();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user)
    throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  return data.user;
}
