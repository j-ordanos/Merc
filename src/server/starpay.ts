import 'server-only';
import axios from 'axios';
import * as yup from 'yup';
import type { Order } from '@/lib/types';
import { paymentPublicUrl, requiredEnv } from './config';
import { AppError } from './errors';
const SANDBOX = 'https://sandbox-api.starpayethiopia.com/v1/starpay-api';
export function paymentConfig() {
  const baseURL = process.env.STARPAY_BASE_URL || SANDBOX;
  if (baseURL !== SANDBOX)
    throw new AppError(503, 'SANDBOX_ONLY', 'Only sandbox payments are enabled for this store.');
  paymentPublicUrl();
  return { baseURL, secret: requiredEnv('STARPAY_API_SECRET') };
}
function client() {
  const { baseURL, secret } = paymentConfig();
  return axios.create({
    baseURL,
    timeout: 20000,
    maxRedirects: 0,
    headers: { 'x-api-secret': secret, 'Content-Type': 'application/json' },
  });
}
const initializationSchema = yup.object({
  order_id: yup.string().nullable(),
  payment_url: yup.string().url().nullable(),
  billRefNo: yup.string().nullable(),
  paymentUrl: yup.string().url().nullable(),
  expires_at: yup.string().nullable().default(null),
});
const verificationSchema = yup.object({
  order_id: yup.string().required(),
  billRefNo: yup.string().optional(),
  metadata: yup.object({ order_reference: yup.string().optional() }).nullable().optional(),
  meta_data: yup.object({ order_reference: yup.string().optional() }).nullable().optional(),
  status: yup.string().required(),
  amount: yup.mixed().required(),
  currency: yup.string().required(),
});
function providerAmount(value: unknown) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)
        ? Number(value)
        : NaN;
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100)))
    throw new Error('Invalid provider amount');
  return amount;
}
export async function initializePayment(order: Order) {
  if (order.delivery.phone !== '0900000000')
    throw new AppError(400, 'INVALID_SANDBOX_PHONE', 'Use the sandbox test number 0900000000.');
  const { data } = await client().post('/trdp/order', {
    amount: order.total_minor / 100,
    currency: 'ETB',
    description: `Merc order ${order.id}`,
    customerName: order.delivery.name,
    // StarPay rejects the local display form; its transaction API requires E.164.
    customerPhoneNumber: '+251900000000',
    customerEmail: order.delivery.email,
    items: order.order_items.map((i) => ({
      productId: i.product_id,
      quantity: i.quantity,
      item_name: i.name,
      unit_price: i.unit_price_minor / 100,
    })),
    callbackURL: `${paymentPublicUrl()}/api/payments/starpay/callback`,
    redirectUrl: `${paymentPublicUrl()}/orders/${order.id}`,
    expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    metadata: { order_reference: order.id },
  });
  if (data.status !== 'success') throw new Error('Unexpected provider response');
  const result = await initializationSchema.validate(data.data, { strict: true });
  const providerOrderId = result.order_id || result.billRefNo;
  const paymentUrlValue = result.payment_url || result.paymentUrl;
  if (!providerOrderId || !paymentUrlValue) throw new Error('Missing payment session details');
  const paymentUrl = new URL(paymentUrlValue);
  if (
    paymentUrl.protocol !== 'https:' ||
    !(
      paymentUrl.hostname === 'starpayethiopia.com' ||
      paymentUrl.hostname.endsWith('.starpayethiopia.com')
    )
  )
    throw new Error('Unexpected payment URL');
  return {
    order_id: providerOrderId,
    payment_url: paymentUrlValue,
    expires_at: result.expires_at,
  };
}
export async function verifyPayment(providerId: string) {
  const { data } = await client().post('/trdp/verify', { orderId: providerId });
  if (data.status !== 'success') throw new Error('Unexpected provider response');
  const result = await verificationSchema.validate(data.data, { strict: true });
  return {
    order_id: result.order_id,
    billRefNo: result.billRefNo,
    metadata: result.meta_data ?? result.metadata ?? undefined,
    status: result.status,
    amount: providerAmount(result.amount),
    currency: result.currency,
  };
}
