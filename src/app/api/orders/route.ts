import { NextResponse } from 'next/server';
import { requireUser } from '@/server/supabase';
import { listOrders } from '@/server/orders';
import { fail } from '@/server/errors';
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(
      { orders: await listOrders(user.id) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return fail(e);
  }
}
