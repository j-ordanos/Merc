'use client';
import { Form, Formik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { useSession } from '@/features/auth/use-session';
import { useCart } from '@/features/cart/store';
import { useCartProducts } from '@/features/cart/cart-page';
import { deliverySchema } from '@/lib/validation';
import type { ApiErrorBody, Delivery } from '@/lib/types';
import { money } from '@/lib/money';
import { api, errorMessage } from '@/lib/http';
import { EmptyState, FormField, Notice, Spinner } from '@/components/ui';
export function CheckoutPage() {
  const session = useSession();
  const router = useRouter();
  const cart = useCart();
  const products = useCartProducts();
  const [error, setError] = useState('');
  const [pendingOrder, setPendingOrder] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    if (session.data && !session.data.user && !session.isFetching)
      router.replace('/auth/login?next=/checkout');
  }, [session.data, session.isFetching, router]);
  if (session.isError)
    return (
      <Notice error>
        {errorMessage(session.error)} <button onClick={() => session.refetch()}>Try again</button>
      </Notice>
    );
  if (!session.data?.user || !cart.hydrated || products.isPending)
    return (
      <div className="loading-state">
        <Spinner /> Getting things ready…
      </div>
    );
  if (products.isError)
    return (
      <Notice error>
        {errorMessage(products.error)} <button onClick={() => products.refetch()}>Try again</button>
      </Notice>
    );
  if (!cart.items.length)
    return (
      <EmptyState
        title="Your bag is waiting."
        description="Choose something you love before checking out."
      />
    );
  const lines = cart.items.map((i) => ({
    ...i,
    product: products.data?.find((p) => p.id === i.productId),
  }));
  const total = lines.reduce((s, l) => s + (l.product?.price_minor || 0) * l.quantity, 0);
  const unavailable = lines.some((l) => !l.product?.available);
  const initialValues: Delivery = {
    name: '',
    email: session.data.user.email || '',
    phone: '0900000000',
    city: 'Addis Ababa',
    address: '',
    instructions: '',
  };
  return (
    <>
      <Link className="back-link" href="/cart">
        <ArrowLeft size={15} /> Back to your bag
      </Link>
      <div className="page-heading compact">
        <span className="eyebrow">SECURE CHECKOUT</span>
        <h1>Checkout</h1>
        <p>Review your order, then complete a test payment with StarPay.</p>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={deliverySchema}
        onSubmit={async (values) => {
          if (submitting.current || unavailable) return;
          submitting.current = true;
          setError('');
          const items = cart.items;
          const fingerprint = JSON.stringify({ items, delivery: values });
          let submission: { fingerprint: string; key: string };
          try {
            submission = JSON.parse(sessionStorage.getItem('merc-checkout') || 'null');
          } catch {
            submission = null as unknown as typeof submission;
          }
          if (!submission || submission.fingerprint !== fingerprint)
            submission = { fingerprint, key: crypto.randomUUID() };
          sessionStorage.setItem('merc-checkout', JSON.stringify(submission));
          try {
            const { data } = await api.post<{ orderId: string; paymentUrl: string }>('/checkout', {
              items,
              delivery: values,
              idempotencyKey: submission.key,
            });
            sessionStorage.setItem('merc-pending-order', data.orderId);
            window.location.assign(data.paymentUrl);
          } catch (e) {
            setError(errorMessage(e));
            if (axios.isAxiosError<ApiErrorBody>(e)) {
              if (e.response?.data.error.orderId) setPendingOrder(e.response.data.error.orderId);
              // Definite provider rejections cannot have created a payment.
              if (
                e.response?.data.error.code === 'PAYMENT_CREDENTIALS_REJECTED' ||
                e.response?.data.error.code === 'PAYMENT_REQUEST_REJECTED'
              )
                sessionStorage.removeItem('merc-checkout');
            }
            submitting.current = false;
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="checkout-layout">
            <div className="checkout-fields">
              <div className="form-section-title">
                <span>01</span>
                <h2>Contact and delivery details</h2>
              </div>
              <div className="form-grid">
                <FormField
                  name="name"
                  label="Full name"
                  autoComplete="name"
                  placeholder="Your full name"
                />
                <FormField name="email" label="Email address" type="email" autoComplete="email" />
                <FormField
                  name="phone"
                  label="Phone number (sandbox)"
                  autoComplete="tel"
                  readOnly
                />
                <FormField name="city" label="City" autoComplete="address-level2" />
              </div>
              <FormField
                name="address"
                label="Delivery address"
                autoComplete="street-address"
                placeholder="Street, building, and a nearby landmark"
              />
              <FormField
                name="instructions"
                label="Delivery notes (optional)"
                as="textarea"
                placeholder="Anything that helps us find you"
              />
              <div className="form-section-title payment-section">
                <span>02</span>
                <h2>Payment</h2>
              </div>
              <div className="payment-option">
                <span className="radio-dot" />
                <div>
                  <strong>Pay with StarPay</strong>
                  <p>Continue to StarPay to complete your payment securely.</p>
                </div>
                <LockKeyhole size={22} />
              </div>
              <Notice>Sandbox checkout · Use 0900000000 on the payment page.</Notice>
            </div>
            <aside className="order-summary">
              <h2>Order summary</h2>
              {lines.map((line) => (
                <div className="checkout-line" key={line.productId}>
                  {line.product && (
                    <div className="checkout-thumb">
                      <Image
                        src={line.product.image_url}
                        alt={line.product.image_alt}
                        fill
                        sizes="60px"
                      />
                      <span>{line.quantity}</span>
                    </div>
                  )}
                  <div>
                    <strong>{line.product?.name || 'Unavailable item'}</strong>
                    <small>Qty {line.quantity}</small>
                  </div>
                  <span>{money((line.product?.price_minor || 0) * line.quantity)}</span>
                </div>
              ))}
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{money(total)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className="green-text">On us</span>
              </div>
              <p className="tax-note">Tax included. No extra checkout charge.</p>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              {error && <Notice error>{error}</Notice>}
              {unavailable && (
                <Notice error>Some items are unavailable. Update your bag before paying.</Notice>
              )}
              {pendingOrder ? (
                <Link href={`/orders/${pendingOrder}`} className="button full-width">
                  Check saved order <ArrowUpRight size={18} />
                </Link>
              ) : (
                <button
                  disabled={isSubmitting || unavailable}
                  type="submit"
                  className="button full-width"
                >
                  Continue to StarPay {isSubmitting ? <Spinner /> : <ArrowUpRight size={18} />}
                </button>
              )}
              <span className="secure-note">
                <LockKeyhole size={14} /> Your payment details stay with StarPay
              </span>
            </aside>
          </Form>
        )}
      </Formik>
    </>
  );
}
