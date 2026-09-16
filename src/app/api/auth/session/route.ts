import { NextResponse } from 'next/server';
import { hasSupabase } from '@/server/config';
import { supabase } from '@/server/supabase';
import { fail } from '@/server/errors';
export async function GET() {
  try {
    if (!hasSupabase()) return NextResponse.json({ user: null, configured: false });
    const db = await supabase();
    const { data } = await db.auth.getUser();
    return NextResponse.json(
      { user: data.user ? { id: data.user.id, email: data.user.email } : null, configured: true },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return fail(e);
  }
}
