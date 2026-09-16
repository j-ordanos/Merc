'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, LockKeyhole, Trash2, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCart } from './store';
import { api, errorMessage } from '@/lib/http';
import type { Product } from '@/lib/types';
import { money } from '@/lib/money';
import { EmptyState, Notice, Quantity, Spinner } from '@/components/ui';
export function useCartProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<{ products: Product[] }>('/products')).data.products,
  });
}
export function CartPage() {
  const cart = useCart();
  const query = useCartProducts();
  if (!cart.hydrated || query.isPending)
    return (
      <div className="loading-state">
        <Spinner /> Opening your bag…
      </div>
    );
  if (query.isError)
    return (
      <Notice error>
        {errorMessage(query.error)} <button onClick={() => query.refetch()}>Try again</button>
      </Notice>
    );
  if (!cart.items.length)
    return (
      <EmptyState
        title="Room for something good."
        description="Your bag is empty. Let’s find a few things you’ll love."
      />
    );
  const lines = cart.items.map((item) => ({
    ...item,
    product: query.data.find((p) => p.id === item.productId),
  }));
  const total = lines.reduce(
    (sum, line) => sum + (line.product?.price_minor || 0) * line.quantity,
    0,
  );
  const unavailable = lines.some((line) => !line.product?.available);
  return (
    <>
      <div className="page-heading compact">
        <span className="eyebrow">YOUR GOOD FINDS</span>
        <h1>
          The shopping bag
          <span className="heading-count">({cart.items.reduce((s, i) => s + i.quantity, 0)})</span>
        </h1>
      </div>
      <div className="cart-layout">
        <div>
          <div className="cart-column-head">
            <span>Product</span>
            <span>Subtotal</span>
          </div>
          {lines.map((line) => (
            <article className="cart-line" key={line.productId}>
              {line.product ? (
                <Link className="cart-image" href={`/products/${line.product.slug}`}>
                  <Image
                    src={line.product.image_url}
                    alt={line.product.image_alt}
                    fill
                    sizes="130px"
                  />
                </Link>
              ) : (
                <div className="cart-image" />
              )}
              <div className="cart-line-info">
                <span className="product-category">{line.product?.category || 'Unavailable'}</span>
                <h2>{line.product?.name || 'Product no longer available'}</h2>
                <p>
                  {line.product ? money(line.product.price_minor) : 'Remove this item to continue'}
                </p>
                <div className="cart-line-controls">
                  <Quantity
                    quantity={line.quantity}
                    name={line.product?.name || 'item'}
                    onChange={(n) => cart.setQuantity(line.productId, n)}
                  />
                  <button
                    className="remove-button"
                    aria-label={`Remove ${line.product?.name || 'item'}`}
                    onClick={() => cart.remove(line.productId)}
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
                {line.product && !line.product.available && (
                  <span className="field-error">Currently unavailable</span>
                )}
              </div>
              <span className="cart-line-total">
                {money((line.product?.price_minor || 0) * line.quantity)}
              </span>
            </article>
          ))}
          <Link href="/products" className="back-link">
            <ArrowLeft size={16} /> Keep exploring
          </Link>
        </div>
        <aside className="order-summary">
          <span className="eyebrow">A FEW GOOD THINGS</span>
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{money(total)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className="green-text">On us</span>
          </div>
          <p className="tax-note">Tax included. No little surprises.</p>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          {unavailable ? (
            <Notice error>Please remove unavailable items to continue.</Notice>
          ) : (
            <Link className="button full-width" href="/checkout">
              Continue to checkout <ArrowRight size={18} />
            </Link>
          )}
          <span className="secure-note">
            <LockKeyhole size={14} /> Secure checkout with StarPay
          </span>
          <div className="summary-delivery">
            <Truck size={20} />
            <span>
              A little something, on us.
              <br />
              <small>Free delivery on every order.</small>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
