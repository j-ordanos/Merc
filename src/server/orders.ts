import 'server-only';
import { createHash } from 'node:crypto';
import axios from 'axios';
import type { CheckoutInput } from '@/lib/validation';
import type { Order, PaymentAttempt, Product } from '@/lib/types';
import { adminDb, supabase } from './supabase';
import { AppError } from './errors';
import { calculateOrder } from './order-pricing';
import { initializePayment, paymentConfig, verifyPayment } from './starpay';
import { verifiedStatus } from './payment-security';
export async function listOrders(userId: string) {
  const db = await supabase();
  const { data, error } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}
export async function getOrder(id: string, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError(404, 'NOT_FOUND', 'Order not found.');
  const db = await supabase();
  const { data, error } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Order not found.');
  return data as Order;
}
export async function checkout(userId: string, input: CheckoutInput) {
  paymentConfig();
  const db = adminDb();
  const normalized = {
    items: [...input.items].sort((a, b) => a.productId.localeCompare(b.productId)),
    delivery: input.delivery,
  };
  const hash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  const { data: products, error: productsError } = await db
    .from('products')
    .select('*')
    .in(
      'id',
      input.items.map((i) => i.productId),
    );
  if (productsError) throw productsError;
  try {
    calculateOrder(input.items, products as Product[]);
  } catch (e) {
    throw new AppError(400, 'CART_CHANGED', (e as Error).message);
  }
  // RPC locks the idempotency key, reads authoritative prices, and inserts order + lines + attempt atomically.
  const { data: claimed, error } = await db.rpc('create_checkout', {
    p_user: userId,
    p_key: input.idempotencyKey,
    p_hash: hash,
    p_items: normalized.items,
    p_delivery: input.delivery,
  });
  if (error) {
    if (error.message.includes('IDEMPOTENCY_CONFLICT'))
      throw new AppError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This checkout was already submitted with different details. Review your existing order.',
      );
    if (error.message.includes('INVALID_CART'))
      throw new AppError(400, 'CART_CHANGED', 'Your bag has changed. Please review your items.');
    throw error;
  }
  const orderId = claimed.order_id as string;
  if (!claimed.claimed) {
    const { data: attempt, error: attemptError } = await db
      .from('payment_attempts')
      .select('*')
      .eq('order_id', orderId)
      .single();
    if (attemptError) throw attemptError;
    if (attempt.status === 'ready' && attempt.payment_url)
      return { orderId, paymentUrl: attempt.payment_url as string };
    throw new AppError(
      409,
      'PAYMENT_UNRESOLVED',
      'This payment is already being processed. Check your order before trying again.',
      orderId,
    );
  }
  const { data: order, error: orderError } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();
  if (orderError) throw orderError;
  try {
    const payment = await initializePayment(order as Order);
    const { error: saveError } = await db
      .from('payment_attempts')
      .update({
        status: 'ready',
        provider_order_id: payment.order_id,
        payment_url: payment.payment_url,
        expires_at: payment.expires_at,
      })
      .eq('order_id', orderId);
    if (saveError) throw saveError;
    return { orderId, paymentUrl: payment.payment_url };
  } catch (error) {
    // Log classification only: Axios errors contain credentials and customer data.
    const providerCode = axios.isAxiosError(error) ? error.response?.data?.error?.code : undefined;
    const credentialsRejected = axios.isAxiosError(error) && error.response?.status === 401;
    const requestRejected =
      axios.isAxiosError(error) && error.response?.status === 400 && providerCode === 'GEN_019';
    console.error('Merc payment initialization failed', {
      orderId,
      type: error instanceof Error ? error.name : 'UnknownError',
      ...(axios.isAxiosError(error)
        ? { httpStatus: error.response?.status, transportCode: error.code }
        : {}),
      ...(typeof providerCode === 'string' && /^[A-Z0-9_]{1,40}$/.test(providerCode)
        ? { providerCode }
        : {}),
    });
    await db
      .from('payment_attempts')
      .update({ status: credentialsRejected || requestRejected ? 'failed' : 'unresolved' })
      .eq('order_id', orderId)
      .eq('status', 'initializing');
    if (credentialsRejected)
      throw new AppError(
        503,
        'PAYMENT_CREDENTIALS_REJECTED',
        'StarPay rejected this store’s API credentials. Please contact the store operator and try again after the configuration is fixed.',
        orderId,
      );
    if (requestRejected)
      throw new AppError(
        502,
        'PAYMENT_REQUEST_REJECTED',
        'StarPay rejected the payment request. Please contact the store operator before trying again.',
        orderId,
      );
    throw new AppError(
      503,
      'PAYMENT_UNRESOLVED',
      'We couldn’t confirm payment initialization. Your order is saved. Do not submit another payment; check its status.',
      orderId,
    );
  }
}
export async function reconcile(order: Order) {
  if (order.status === 'paid') return { order, verification: 'verified' as const };
  const db = adminDb();
  const { data, error } = await db
    .from('payment_attempts')
    .select('*')
    .eq('order_id', order.id)
    .single();
  if (error) throw error;
  const attempt = data as PaymentAttempt;
  if (!attempt.provider_order_id) return { order, verification: 'unavailable' as const };
  try {
    const result = await verifyPayment(attempt.provider_order_id);
    const status = verifiedStatus(result, {
      providerId: attempt.provider_order_id,
      orderId: order.id,
      total: order.total_minor,
    });
    if (status !== 'pending') {
      const { error: updateError } = await db
        .from('orders')
        .update({ status, ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}) })
        .eq('id', order.id)
        .neq('status', 'paid');
      if (updateError) throw updateError;
    }
    const { data: refreshed, error: readError } = await db
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single();
    if (readError) throw readError;
    return { order: refreshed as Order, verification: 'verified' as const };
  } catch (error) {
    const providerCode = axios.isAxiosError(error) ? error.response?.data?.error?.code : undefined;
    console.error('Merc payment verification failed', {
      orderId: order.id,
      type: error instanceof Error ? error.name : 'UnknownError',
      ...(axios.isAxiosError(error)
        ? { httpStatus: error.response?.status, transportCode: error.code }
        : {}),
      ...(typeof providerCode === 'string' && /^[A-Z0-9_]{1,40}$/.test(providerCode)
        ? { providerCode }
        : {}),
    });
    return { order, verification: 'unavailable' as const };
  }
}
