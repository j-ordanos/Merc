import { createHmac, timingSafeEqual } from 'node:crypto';
export function validSignature(
  payload: unknown,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
) {
  if (
    !timestamp ||
    !/^\d{10,13}$/.test(timestamp) ||
    !signature ||
    !/^[0-9a-f]{64}$/i.test(signature)
  )
    return false;
  const millis = timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (Math.abs(now - millis) > 300000) return false;
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
export function verifiedStatus(
  data: { order_id: string; amount: number; currency: string; status: string },
  expected: { providerId: string; total: number },
) {
  if (
    data.order_id !== expected.providerId ||
    data.currency !== 'ETB' ||
    !Number.isFinite(data.amount) ||
    Math.abs(data.amount * 100 - expected.total) > 0.000001
  )
    throw new Error('Payment verification does not match the order.');
  if (data.status === 'PAID') return 'paid';
  if (data.status === 'FAILED' || data.status === 'CANCELLED') return 'failed';
  if (data.status === 'EXPIRED') return 'expired';
  return 'pending';
}
