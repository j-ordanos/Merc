import { NextResponse } from 'next/server';
import { requireUser } from '@/server/supabase';
import { getOrder, reconcile } from '@/server/orders';
import { assertSameOrigin, fail } from '@/server/errors';
export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    return NextResponse.json(await reconcile(await getOrder((await params).id, user.id)), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return fail(e);
  }
}
