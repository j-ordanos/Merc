'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Clock3, RefreshCw, LogOut, CircleX } from 'lucide-react';
import { useSession } from '@/features/auth/use-session';
import { useCart } from '@/features/cart/store';
import { api, errorMessage } from '@/lib/http';
import type { Order } from '@/lib/types';
import { money } from '@/lib/money';
import { EmptyState, Notice, Spinner } from '@/components/ui';
function useOrderAuth(path: string) {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session.data && !session.data.user)
      router.replace(`/auth/login?next=${encodeURIComponent(path)}`);
  }, [session.data, router, path]);
  return session;
}
export function OrdersPage() {
  const session = useOrderAuth('/orders');
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['orders', session.data?.user?.id],
    enabled: !!session.data?.user,
    queryFn: async () => (await api.get<{ orders: Order[] }>('/orders')).data.orders,
  });
  if (session.isError) return <Notice error>{errorMessage(session.error)}</Notice>;
  if (query.isPending)
    return (
      <div className="loading-state">
        <Spinner /> Finding your good things…
      </div>
    );
  if (query.isError)
    return (
      <Notice error>
        {errorMessage(query.error)} <button onClick={() => query.refetch()}>Try again</button>
      </Notice>
    );
  return (
    <>
      <div className="section-heading">
        <div className="page-heading compact">
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Your orders.</h1>
          <p>{session.data?.user?.email}</p>
        </div>
        <button
          className="text-link"
          onClick={async () => {
            try {
              await api.post('/auth/logout');
              queryClient.clear();
              router.push('/');
              router.refresh();
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          Sign out <LogOut size={16} />
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {!query.data.length ? (
        <EmptyState
          title="Your story starts here."
          description="Your orders will appear here once you find something you love."
        />
      ) : (
        <div className="orders-list">
          {query.data.map((order) => (
            <Link className="order-card" href={`/orders/${order.id}`} key={order.id}>
              <div>
                <span className="eyebrow">ORDER {order.id.slice(0, 8)}</span>
                <h2>
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <span className="muted">
                  {order.order_items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
              <strong>{money(order.total_minor)}</strong>
              <ArrowRight size={20} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
export function OrderPage({ id }: { id: string }) {
  const session = useOrderAuth(`/orders/${id}`);
  const settle = useCart((s) => s.settle);
  const hydrated = useCart((s) => s.hydrated);
  const [started] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ['order', id, session.data?.user?.id],
    enabled: !!session.data?.user,
    retry: 1,
    queryFn: async () =>
      (
        await api.post<{ order: Order; verification: 'verified' | 'unavailable' }>(
          `/orders/${id}/verify`,
        )
      ).data,
    refetchInterval: (q) =>
      q.state.data?.order.status === 'pending' && Date.now() - started < 120000 ? 5000 : false,
  });
  const order = query.data?.order;
  useEffect(() => {
    if (order?.status === 'paid' && hydrated) {
      settle(
        order.id,
        order.order_items.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
      );
      sessionStorage.removeItem('merc-checkout');
      sessionStorage.removeItem('merc-pending-order');
    }
  }, [order, hydrated, settle]);
  if (session.isError) return <Notice error>{errorMessage(session.error)}</Notice>;
  if (query.isPending)
    return (
      <div className="loading-state">
        <Spinner /> Checking your order…
      </div>
    );
  if (query.isError || !order)
    return (
      <Notice error>
        {errorMessage(query.error)} <button onClick={() => query.refetch()}>Try again</button>
      </Notice>
    );
  const paid = order.status === 'paid';
  const pending = order.status === 'pending';
  return (
    <>
      <Link href="/orders" className="back-link">
        <ArrowLeft size={16} /> All your orders
      </Link>
      <div className="order-status">
        <span className={`status-icon ${paid ? 'is-paid' : ''}`}>
          {paid ? <Check size={28} /> : pending ? <Clock3 size={28} /> : <CircleX size={28} />}
        </span>
        <span className="eyebrow">ORDER {order.id.slice(0, 8)}</span>
        <h1>
          {paid
            ? 'A few good things, coming your way.'
            : pending
              ? 'Your good things are on hold.'
              : 'Let’s take a little pause.'}
        </h1>
        <p>
          {paid
            ? 'Payment confirmed. Your order is saved below. Thank you for shopping with Merc.'
            : pending
              ? 'We’re waiting for payment confirmation. You can come back to this page any time.'
              : `Your payment ${order.status === 'expired' ? 'session expired' : 'was not completed'}. Your bag has been kept for you.`}
        </p>
        {query.data?.verification === 'unavailable' && (
          <Notice>
            We can’t verify this payment right now. Your order is saved. Check again before starting
            another payment.
          </Notice>
        )}
        {!paid && (
          <button
            className="button button-outline"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching ? <Spinner /> : <RefreshCw size={16} />} Check payment status
          </button>
        )}
      </div>
      <div className="order-detail-grid">
        <section className="order-panel">
          <h2>Your good finds</h2>
          {order.order_items.map((i) => (
            <div className="checkout-line" key={i.product_id}>
              <div className="checkout-thumb">
                <Image src={i.image_url} alt={i.name} fill sizes="60px" />
              </div>
              <div>
                <strong>{i.name}</strong>
                <small>Qty {i.quantity}</small>
              </div>
              <span>{money(i.unit_price_minor * i.quantity)}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Delivery</span>
            <span>Free</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{money(order.total_minor)}</strong>
          </div>
        </section>
        <section className="order-panel">
          <span className={`status-badge status-${order.status}`}>{order.status}</span>
          <h2>Delivery details</h2>
          <p>
            {order.delivery.name}
            <br />
            {order.delivery.address}
            <br />
            {order.delivery.city}
          </p>
          <p>
            {order.delivery.email}
            <br />
            {order.delivery.phone}
          </p>
          {order.delivery.instructions && <p>{order.delivery.instructions}</p>}
          <p className="muted">Sandbox demonstration. No physical delivery.</p>
          <Link className="text-link" href="/products">
            Keep exploring <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
