'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowRight,
  ShoppingBag,
  UserRound,
  Search,
  Menu,
  X,
  Leaf,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/features/cart/store';
import { useSession } from '@/features/auth/use-session';
import { api, errorMessage } from '@/lib/http';
import { useQueryClient } from '@tanstack/react-query';
export function Header() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const cart = useCart();
  const session = useSession();
  const query = useQueryClient();
  async function logout() {
    try {
      await api.post('/auth/logout');
      query.clear();
      router.push('/');
      router.refresh();
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <div className="announcement">
        <span>Good things, thoughtfully chosen.</span>
        <span>
          Free delivery on every order <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="wordmark" aria-label="Merc home">
            merc<span>®</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link className={path === '/products' ? 'active' : ''} href="/products">
              Shop all
            </Link>
            <Link href="/products?category=home">Home & living</Link>
            <Link href="/products?category=accessories">Accessories</Link>
            <Link href="/products?category=essentials">Everyday essentials</Link>
          </nav>
          <div className="header-actions">
            <Link
              href="/products?focus=search"
              className="icon-button desktop-only"
              aria-label="Search products"
            >
              <Search size={20} />
            </Link>
            <Link
              href={session.data?.user ? '/orders' : '/auth/login'}
              className="icon-button"
              aria-label={session.data?.user ? 'Your orders' : 'Sign in'}
            >
              <UserRound size={20} />
            </Link>
            <Link
              href="/cart"
              className="bag-link"
              aria-label={`Shopping bag, ${cart.hydrated ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0} items`}
            >
              <ShoppingBag size={19} />
              <span className="desktop-only">Bag</span>
              <span className="bag-count">
                {cart.hydrated ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0}
              </span>
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
          </div>
        </div>
        {open && (
          <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
            {[
              ['Shop all', '/products'],
              ['Home & living', '/products?category=home'],
              ['Accessories', '/products?category=accessories'],
              ['Everyday essentials', '/products?category=essentials'],
              ['Your orders', '/orders'],
            ].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
                <ArrowRight size={16} />
              </Link>
            ))}
            {session.data?.user && <button onClick={logout}>Sign out</button>}
            {error && <p role="alert">{error}</p>}
          </nav>
        )}
      </header>
    </>
  );
}
export function Benefits() {
  return (
    <div className="benefits container">
      <div>
        <Truck />
        <span>
          <strong>On the house</strong>
          <small>Free delivery, every order.</small>
        </span>
      </div>
      <div>
        <Leaf />
        <span>
          <strong>Less, but better</strong>
          <small>Considered pieces. Everyday purpose.</small>
        </span>
      </div>
      <div>
        <ShieldCheck />
        <span>
          <strong>Shop with confidence</strong>
          <small>Secure checkout with StarPay.</small>
        </span>
      </div>
    </div>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="container footer-main">
        <div>
          <Link className="wordmark" href="/">
            merc<span>®</span>
          </Link>
          <p>
            For a life well lived.
            <br />
            Good things for your everyday.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <span className="eyebrow">Explore</span>
            <Link href="/products">The collection</Link>
            <Link href="/products?category=home">Home & living</Link>
            <Link href="/products?category=accessories">Accessories</Link>
          </div>
          <div>
            <span className="eyebrow">Make yourself at home</span>
            <Link href="/orders">Your orders</Link>
            <Link href="/cart">Your shopping bag</Link>
            <Link href="/about">Our story & helpful details</Link>
          </div>
        </div>
        <div className="footer-note">
          <span className="eyebrow">A little more intentional.</span>
          <p>
            Surround yourself with things
            <br />
            you love to use.
          </p>
          <Link className="text-link" href="/about">
            Meet Merc <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Merc. Made for everyday.</span>
        <span>
          Addis Ababa, Ethiopia <span className="dot">·</span> ETB
        </span>
        <span className="payment-wordmark">
          Secure payments by <strong>StarPay ↗</strong>
        </span>
      </div>
    </footer>
  );
}
