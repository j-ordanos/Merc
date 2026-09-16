import { NextResponse } from 'next/server';
import { requireUser } from '@/server/supabase';
import { getOrder } from '@/server/orders';
import { fail } from '@/server/errors';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    return NextResponse.json(
      { order: await getOrder((await params).id, user.id) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return fail(e);
  }
}
