'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Plus,
  Search,
  ChevronDown,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/lib/types';
import { money } from '@/lib/money';
import { api, errorMessage } from '@/lib/http';
import { useCart } from '@/features/cart/store';
import { categories } from './data';
import { EmptyState, Notice, Quantity } from '@/components/ui';
import { useToast } from '@/components/toast';
export function AddToBag({
  product,
  full = false,
  quantity = 1,
}: {
  product: Product;
  full?: boolean;
  quantity?: number;
}) {
  const add = useCart((s) => s.add);
  const showToast = useToast((s) => s.show);
  const [added, setAdded] = useState(false);
  return (
    <button
      disabled={!product.available}
      className={full ? 'button full-width' : 'quick-add'}
      aria-label={added ? `${product.name} added to bag` : `Add ${product.name} to bag`}
      onClick={() => {
        add(product.id, quantity);
        showToast(`${product.name} added to bag`, '/cart', 'View bag');
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      {full &&
        (product.available
          ? added
            ? 'Added to your bag'
            : 'Add to bag'
          : 'Currently unavailable')}
      {added ? <Check size={18} /> : <Plus size={18} />}
    </button>
  );
}
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.image_url}
            alt={product.image_alt}
            fill
            sizes="(max-width: 600px) 48vw, (max-width: 900px) 45vw, 25vw"
            priority={priority}
          />
        </Link>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <AddToBag product={product} />
      </div>
      <div className="product-meta">
        <span className="product-category">
          {categories.find((c) => c.id === product.category)?.name}
        </span>
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
          <span className="product-price">{money(product.price_minor)}</span>
        </div>
      </div>
    </article>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
export function Catalog({ initialProducts }: { initialProducts: Product[] }) {
  const params = useSearchParams();
  const category = params.get('category') || 'all';
  const search = params.get('q') || '';
  const sort = params.get('sort') || 'featured';
  const query = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<{ products: Product[] }>('/products')).data.products,
    initialData: initialProducts,
  });
  function change(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(null, '', `/products?${next.toString()}`);
  }
  const products = (query.data || [])
    .filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'price-low'
        ? a.price_minor - b.price_minor
        : sort === 'price-high'
          ? b.price_minor - a.price_minor
          : sort === 'name'
            ? a.name.localeCompare(b.name)
            : Number(b.featured) - Number(a.featured),
    );
  return (
    <>
      <div className="catalog-toolbar">
        <div className="category-tabs" aria-label="Product categories">
          {[{ id: 'all', name: 'All products' }, ...categories].map((c) => (
            <button
              key={c.id}
              className={category === c.id ? 'selected' : ''}
              aria-pressed={category === c.id}
              onClick={() => change('category', c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="catalog-controls">
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Search the collection"
              placeholder="Search products"
              value={search}
              autoFocus={params.get('focus') === 'search'}
              onChange={(e) => change('q', e.target.value)}
            />
          </label>
          <label className="sort-input">
            <span>Sort by</span>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => change('sort', e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A–Z</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        {products.length} {products.length === 1 ? 'product' : 'products'}
      </p>
      {query.isError && (
        <Notice error>
          {errorMessage(query.error)}{' '}
          <button className="text-link" onClick={() => query.refetch()}>
            Try again
          </button>
        </Notice>
      )}
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState title="No products found" description="Try another search or category." />
      )}
    </>
  );
}
export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  return (
    <>
      <Link href="/products" className="back-link">
        <ArrowLeft size={15} /> Back to the collection
      </Link>
      <div className="product-detail">
        <div className="detail-image">
          <Image
            src={product.image_url}
            alt={product.image_alt}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 55vw"
          />
          {product.badge && <span className="product-badge">{product.badge}</span>}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{categories.find((c) => c.id === product.category)?.name}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">{money(product.price_minor)}</p>
          <p className="detail-description">{product.description}</p>
          <div className="detail-buy">
            <Quantity quantity={quantity} onChange={setQuantity} name={product.name} />
            <span className="muted">
              {product.available ? 'Available' : 'Currently unavailable'}
            </span>
          </div>
          <AddToBag product={product} full quantity={quantity} />
          <Link href="/cart" className="text-link view-bag">
            View your bag <ArrowUpRight size={16} />
          </Link>
          <div className="detail-perks">
            <span>
              <ShieldCheck size={17} /> Secure checkout
            </span>
          </div>
          <details open>
            <summary>Product details</summary>
            <ul>
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </>
  );
}
