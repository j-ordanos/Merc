import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { sampleProducts } from '@/features/catalog/data';
import { calculateOrder } from '@/server/order-pricing';
import { validSignature, verifiedStatus } from '@/server/payment-security';
import { checkoutSchema, deliverySchema, safeNext } from '@/lib/validation';
import { useCart, sanitizeItems } from '@/features/cart/store';
const delivery = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '0900000000',
  city: 'Addis Ababa',
  address: 'Test street 123',
  instructions: '',
};
describe('authoritative pricing', () => {
  it('calculates integer totals from catalog prices', () => {
    const result = calculateOrder(
      [{ productId: sampleProducts[0].id, quantity: 3 }],
      sampleProducts,
    );
    expect(result.total).toBe(255000);
    expect(result.lines[0].unit_price_minor).toBe(85000);
  });
  it('rejects unavailable, missing, duplicate, and invalid quantities', () => {
    expect(() => calculateOrder([{ productId: 'missing', quantity: 1 }], sampleProducts)).toThrow();
    expect(() =>
      calculateOrder(
        [{ productId: sampleProducts[0].id, quantity: 1 }],
        [{ ...sampleProducts[0], available: false }],
      ),
    ).toThrow();
    for (const quantity of [0, -1, 11, 1.5, NaN])
      expect(() =>
        calculateOrder([{ productId: sampleProducts[0].id, quantity }], sampleProducts),
      ).toThrow();
    expect(() =>
      calculateOrder(
        Array(2).fill({ productId: sampleProducts[0].id, quantity: 1 }),
        sampleProducts,
      ),
    ).toThrow();
  });
});
describe('checkout validation', () => {
  it('accepts complete sandbox delivery details', async () => {
    await expect(deliverySchema.validate(delivery)).resolves.toEqual(delivery);
  });
  it('rejects real phone numbers, empty carts, and submitted prices', async () => {
    await expect(deliverySchema.validate({ ...delivery, phone: '0912345678' })).rejects.toThrow();
    await expect(
      checkoutSchema.validate({ delivery, items: [], idempotencyKey: crypto.randomUUID() }),
    ).rejects.toThrow();
    await expect(
      checkoutSchema.validate(
        {
          delivery,
          items: [{ productId: sampleProducts[0].id, quantity: 1, price: 1 }],
          idempotencyKey: crypto.randomUUID(),
        },
        { strict: true },
      ),
    ).rejects.toThrow();
  });
  it('prevents external redirect destinations', () => {
    expect(safeNext('//evil.example')).toBe('/orders');
    expect(safeNext('/\\evil.example')).toBe('/orders');
    expect(safeNext('https://evil.example')).toBe('/orders');
    expect(safeNext('/checkout')).toBe('/checkout');
  });
});
describe('payment verification', () => {
  const payload = { order_id: 'provider-1', status: 'PAID', amount: 850, currency: 'ETB' };
  const secret = 'test-only-secret';
  const timestamp = '1770748190504';
  const now = Number(timestamp);
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');
  it('accepts authentic callbacks within the time window', () => {
    expect(validSignature(payload, timestamp, signature, secret, now)).toBe(true);
  });
  it('rejects tampering, malformed signatures, stale and future callbacks', () => {
    expect(validSignature({ ...payload, amount: 1 }, timestamp, signature, secret, now)).toBe(
      false,
    );
    expect(validSignature(payload, timestamp, 'bad', secret, now)).toBe(false);
    expect(validSignature(payload, null, signature, secret, now)).toBe(false);
    expect(validSignature(payload, timestamp, signature, secret, now + 300001)).toBe(false);
    expect(validSignature(payload, timestamp, signature, secret, now - 300001)).toBe(false);
  });
  it('requires matching order, amount and currency before accepting paid', () => {
    expect(verifiedStatus(payload, { providerId: 'provider-1', total: 85000 })).toBe('paid');
    expect(() => verifiedStatus(payload, { providerId: 'another-order', total: 85000 })).toThrow();
    expect(() => verifiedStatus(payload, { providerId: 'provider-1', total: 1 })).toThrow();
    expect(() =>
      verifiedStatus({ ...payload, currency: 'USD' }, { providerId: 'provider-1', total: 85000 }),
    ).toThrow();
    expect(
      verifiedStatus(
        { ...payload, status: 'UNRECOGNIZED' },
        { providerId: 'provider-1', total: 85000 },
      ),
    ).toBe('pending');
  });
});
describe('persistent cart behavior', () => {
  beforeEach(() => useCart.setState({ items: [], settledOrders: [] }));
  it('sanitizes persisted data and bounds quantities', () => {
    expect(
      sanitizeItems([
        { productId: 'a', quantity: 100 },
        { productId: 'a', quantity: 2 },
        { productId: 'b', quantity: -1 },
      ]),
    ).toEqual([{ productId: 'a', quantity: 2 }]);
  });
  it('removes purchased quantities exactly once, retaining additions', () => {
    useCart.getState().add('a', 4);
    useCart.getState().add('b', 1);
    useCart.getState().settle('order-1', [{ productId: 'a', quantity: 2 }]);
    useCart.getState().settle('order-1', [{ productId: 'a', quantity: 2 }]);
    expect(useCart.getState().items).toEqual([
      { productId: 'a', quantity: 2 },
      { productId: 'b', quantity: 1 },
    ]);
  });
});
