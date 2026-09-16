import { NextResponse } from 'next/server';
import { supabase } from '@/server/supabase';
import { safeNext } from '@/lib/validation';
import { appUrl } from '@/server/config';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')), appUrl()));
  }
  return NextResponse.redirect(new URL('/auth/login?error=confirmation', appUrl()));
}
