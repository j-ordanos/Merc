import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc, initialize, verify, db, from } = vi.hoisted(() => {
  const rpc = vi.fn();
  const initialize = vi.fn();
  const verify = vi.fn();
  const from = vi.fn();
  return { rpc, initialize, verify, from, db: { rpc, from } };
});
vi.mock('@/server/supabase', () => ({ adminDb: () => db, supabase: async () => db }));
vi.mock('@/server/starpay', () => ({
  paymentConfig: () => ({}),
  initializePayment: initialize,
  verifyPayment: verify,
}));
import { checkout, getOrder, reconcile } from '@/server/orders';
import { sampleProducts } from '@/features/catalog/data';
import type { Order } from '@/lib/types';
const order: Order = {
  id: '00000000-0000-4000-8000-000000000099',
  user_id: 'alice',
  status: 'pending',
  total_minor: 85000,
  currency: 'ETB',
  delivery: {
    name: 'Test',
    email: 'test@example.com',
    phone: '0900000000',
    city: 'Addis Ababa',
    address: 'Test address',
    instructions: '',
  },
  created_at: new Date().toISOString(),
  order_items: [],
};
const input = {
  items: [{ productId: sampleProducts[0].id, quantity: 1 }],
  delivery: { ...order.delivery, phone: '0900000000' as const },
  idempotencyKey: crypto.randomUUID(),
};
function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const key of ['select', 'eq', 'neq', 'in', 'update', 'order']) c[key] = vi.fn(() => c);
  c.single = vi.fn(async () => result);
  c.maybeSingle = vi.fn(async () => result);
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return c;
}
beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: { order_id: order.id, claimed: true }, error: null });
});
describe('payment orchestration', () => {
  it('does not reinitialize an already claimed checkout', async () => {
    rpc.mockResolvedValue({ data: { order_id: order.id, claimed: false }, error: null });
    from.mockImplementation((table: string) =>
      chain({
        data:
          table === 'products'
            ? sampleProducts
            : { status: 'ready', payment_url: 'https://sandbox.starpayethiopia.com/pay' },
        error: null,
      }),
    );
    expect((await checkout('alice', input)).paymentUrl).toContain('starpayethiopia.com');
    expect(initialize).not.toHaveBeenCalled();
  });
  it('keeps ambiguous initialization failures unresolved and never retries', async () => {
    from.mockImplementation((table: string) =>
      chain({ data: table === 'products' ? sampleProducts : order, error: null }),
    );
    initialize.mockRejectedValue(new Error('timeout'));
    await expect(checkout('alice', input)).rejects.toMatchObject({
      code: 'PAYMENT_UNRESOLVED',
      orderId: order.id,
    });
    expect(initialize).toHaveBeenCalledTimes(1);
  });
  it('accepts the documented StarPay payment fields', async () => {
    rpc.mockResolvedValue({ data: { order_id: order.id, claimed: true }, error: null });
    from.mockImplementation((table: string) =>
      chain({ data: table === 'products' ? sampleProducts : order, error: null }),
    );
    initialize.mockResolvedValue({
      order_id: 'starpay-order',
      payment_url: 'https://pay.starpayethiopia.com/checkout/starpay-order',
      expires_at: null,
    });
    await expect(checkout('alice', input)).resolves.toMatchObject({
      orderId: order.id,
      paymentUrl: expect.stringContaining('starpayethiopia.com'),
    });
  });
  it('does not mark an order paid on a mismatched amount or unavailable provider', async () => {
    from.mockReturnValue(chain({ data: { provider_order_id: 'provider-1' }, error: null }));
    verify.mockResolvedValue({
      order_id: 'provider-1',
      amount: 1,
      currency: 'ETB',
      status: 'PAID',
    });
    expect((await reconcile(order)).verification).toBe('unavailable');
    verify.mockRejectedValue(new Error('timeout'));
    expect((await reconcile(order)).order.status).toBe('pending');
  });
  it('does not regress a paid order or re-contact the provider', async () => {
    expect((await reconcile({ ...order, status: 'paid' })).order.status).toBe('paid');
    expect(verify).not.toHaveBeenCalled();
  });
  it('includes the owner constraint in order lookup', async () => {
    const builder = chain({ data: null, error: null });
    from.mockReturnValue(builder);
    await expect(getOrder(order.id, 'bob')).rejects.toMatchObject({ status: 404 });
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'bob');
  });
});
