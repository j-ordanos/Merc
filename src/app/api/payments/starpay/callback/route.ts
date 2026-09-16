import { NextResponse } from 'next/server';
import { AppError, fail, jsonBody } from '@/server/errors';
import { requiredEnv } from '@/server/config';
import { validSignature } from '@/server/payment-security';
import { adminDb } from '@/server/supabase';
import { reconcile } from '@/server/orders';
import type { Order } from '@/lib/types';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const payload = await jsonBody(request);
    if (
      !validSignature(
        payload,
        request.headers.get('x-timestamp'),
        request.headers.get('x-signature'),
        requiredEnv('STARPAY_WEBHOOK_SECRET'),
      )
    )
      throw new AppError(401, 'SIGNATURE', 'Invalid callback signature.');
    const providerId =
      payload?.data?.order_id ??
      payload?.data?.billRefNo ??
      payload?.order_id ??
      payload?.billRefNo;
    if (typeof providerId !== 'string')
      throw new AppError(400, 'INVALID_CALLBACK', 'Missing order reference.');
    const db = adminDb();
    const { data: attempt, error } = await db
      .from('payment_attempts')
      .select('order_id')
      .eq('provider_order_id', providerId)
      .maybeSingle();
    if (error) throw error;
    if (!attempt)
      throw new AppError(503, 'ORDER_NOT_READY', 'Order is not ready for verification.');
    const { data: order, error: orderError } = await db
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', attempt.order_id)
      .single();
    if (orderError) throw orderError;
    const result = await reconcile(order as Order);
    if (result.verification === 'unavailable')
      throw new AppError(
        503,
        'VERIFICATION_UNAVAILABLE',
        'Payment verification temporarily unavailable.',
      );
    return NextResponse.json({ received: true });
  } catch (e) {
    return fail(e);
  }
}
