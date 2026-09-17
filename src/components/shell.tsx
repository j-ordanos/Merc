'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/lib/types';
import { money } from '@/lib/money';
import { api } from '@/lib/http';
import { useCart } from '@/features/cart/store';
import { AccountMenu } from '@/components/account-menu';

const navigation = [
  { label: 'Shop', href: '/products' },
  { label: 'Orders', href: '/orders' },
];

const announcement = {
  text: 'Explore the Merc collection',
  action: 'Shop products',
  href: '/products',
};

function AnnouncementBar() {
  return (
    <div className="announcement">
      <span>{announcement.text}</span>
      <Link href={announcement.href}>
        {announcement.action} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function SearchPanel({ close }: { close: () => void }) {
  const [term, setTerm] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<{ products: Product[] }>('/products')).data.products,
  });
  const matches = (query.data || [])
    .filter((product) => product.name.toLowerCase().includes(term.trim().toLowerCase()))
    .slice(0, 6);

  useEffect(() => {
    input.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab' || !dialog.current) return;
      const focusable = [
        ...dialog.current.querySelectorAll<HTMLElement>('a, button, input:not([disabled])'),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <div
      className="search-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialog}
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
      >
        <div className="search-panel-top">
          <label htmlFor="global-search">Search products</label>
          <button type="button" className="icon-button" onClick={close} aria-label="Close search">
            <X size={22} />
          </button>
        </div>
        <div className="search-panel-input">
          <Search size={21} aria-hidden="true" />
          <input
            id="global-search"
            ref={input}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Try ‘mug’ or ‘tote’"
            autoComplete="off"
          />
        </div>
        <div className="search-results" aria-live="polite">
          {query.isPending && <p className="search-message">Loading products…</p>}
          {query.isError && (
            <p className="search-message">
              Products could not be loaded.{' '}
              <button type="button" onClick={() => query.refetch()}>
                Try again
              </button>
            </p>
          )}
          {query.isSuccess && !term.trim() && (
            <p className="search-message">Start typing a product name to see matches.</p>
          )}
          {query.isSuccess && term.trim() && !matches.length && (
            <p className="search-message">No products match “{term.trim()}”. Try another name.</p>
          )}
          {query.isSuccess && term.trim() && matches.length > 0 && (
            <ul>
              {matches.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`} onClick={close}>
                    <span className="search-result-image">
                      <Image src={product.image_url} alt="" fill sizes="64px" />
                    </span>
                    <span className="search-result-name">{product.name}</span>
                    <strong>{money(product.price_minor)}</strong>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/products" className="search-all" onClick={close}>
          Browse all products <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}

export function Header() {
  const path = usePathname();
  return <HeaderContent key={path} path={path} />;
}

function HeaderContent({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);
  const searchButton = useRef<HTMLButtonElement>(null);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    searchButton.current?.focus();
  }, []);
  const cart = useCart();
  const count = cart.hydrated ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY;
      if (current < 100 || open || searchOpen) setHidden(false);
      else if (Math.abs(current - lastScroll.current) > 5) setHidden(current > lastScroll.current);
      lastScroll.current = current;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open, searchOpen]);

  return (
    <>
      <AnnouncementBar />
      <header className={`site-header ${hidden ? 'is-hidden' : ''}`}>
        <div className="container header-inner">
          <Link href="/" className="wordmark" aria-label="Merc home">
            merc<span>·</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                className={
                  path === item.href || (item.href === '/orders' && path.startsWith('/orders/'))
                    ? 'active'
                    : ''
                }
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              ref={searchButton}
              className="icon-button search-action"
              aria-label="Search products"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen(true);
                setHidden(false);
              }}
            >
              <Search size={20} strokeWidth={1.7} />
            </button>
            <Link href="/cart" className="bag-link" aria-label={`Shopping bag, ${count} items`}>
              <ShoppingBag size={20} strokeWidth={1.7} />
              <span className="bag-count">{count}</span>
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
            <AccountMenu />
          </div>
        </div>
        {open && (
          <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label} <ArrowRight size={17} />
              </Link>
            ))}
          </nav>
        )}
      </header>
      {searchOpen && <SearchPanel close={closeSearch} />}
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <span className="footer-kicker">MERC / ADDIS ABABA</span>
          <Link className="wordmark" href="/">
            merc<span>·</span>
          </Link>
          <p>A clear place to shop home goods, accessories and useful everyday pieces in ETB.</p>
          <Link className="footer-cta" href="/products">
            Browse the collection <ArrowUpRight size={17} />
          </Link>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <div>
            <span className="footer-title">Shop</span>
            <Link href="/">Home</Link>
            <Link href="/products">All products</Link>
            <Link href="/products#categories">Categories</Link>
            <Link href="/cart">Shopping bag</Link>
          </div>
          <div>
            <span className="footer-title">Help</span>
            <Link href="/help">Help center</Link>
            <Link href="/docs#faq">FAQs</Link>
            <Link href="/docs">How Merc works</Link>
            <Link href="/help#contact">Contact</Link>
          </div>
          <div>
            <span className="footer-title">Merc</span>
            <Link href="/story">Our story</Link>
            <Link href="/developer">Developer</Link>
            <Link href="/orders">Your orders</Link>
          </div>
          <div>
            <span className="footer-title">Legal</span>
            <Link href="/terms">Terms of use</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/license">License & agreement</Link>
          </div>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Merc</span>
        <div className="footer-meta">
          <span>Prices in ETB</span>
          <span className="footer-dot" aria-hidden="true" />
          <span>StarPay sandbox checkout</span>
        </div>
      </div>
    </footer>
  );
}
