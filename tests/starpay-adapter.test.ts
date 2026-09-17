import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Order } from '@/lib/types';

const post = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { create: () => ({ post }) } }));

import { initializePayment } from '@/server/starpay';

const order: Order = {
  id: '00000000-0000-4000-8000-000000000099',
  user_id: '00000000-0000-4000-8000-000000000001',
  status: 'pending',
  total_minor: 370000,
  currency: 'ETB',
  delivery: {
    name: 'Sandbox Test',
    email: 'sandbox-test@example.com',
    phone: '0900000000',
    city: 'Addis Ababa',
    address: 'Test address',
    instructions: '',
  },
  created_at: new Date().toISOString(),
  order_items: [
    {
      product_id: '00000000-0000-4000-8000-000000000008',
      name: 'Test item',
      description: 'Test item',
      image_url: 'https://example.com/item.jpg',
      unit_price_minor: 185000,
      quantity: 2,
    },
  ],
};

beforeEach(() => {
  vi.stubEnv('APP_URL', 'https://merc-lac.vercel.app');
  vi.stubEnv('STARPAY_PUBLIC_URL', 'https://merc-lac.vercel.app');
  vi.stubEnv('STARPAY_API_SECRET', 'test-only-secret');
  vi.stubEnv('STARPAY_BASE_URL', 'https://sandbox-api.starpayethiopia.com/v1/starpay-api');
  post.mockResolvedValue({
    data: {
      status: 'success',
      data: {
        order_id: 'provider-order',
        payment_url: 'https://pay.starpayethiopia.com/checkout/provider-order',
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('StarPay initialization request', () => {
  it('sends the sandbox number in the format accepted by StarPay', async () => {
    await initializePayment(order);
    expect(post).toHaveBeenCalledWith(
      '/trdp/order',
      expect.objectContaining({
        amount: 3700,
        customerPhoneNumber: '+251900000000',
        callbackURL: 'https://merc-lac.vercel.app/api/payments/starpay/callback',
      }),
    );
  });

  it('does not send a non-test phone number to the sandbox', async () => {
    await expect(
      initializePayment({ ...order, delivery: { ...order.delivery, phone: '0912345678' } }),
    ).rejects.toMatchObject({ code: 'INVALID_SANDBOX_PHONE' });
    expect(post).not.toHaveBeenCalled();
  });
});
