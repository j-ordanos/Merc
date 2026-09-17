'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/features/cart/store';
import { AccountMenu } from '@/components/account-menu';

const navigation = [
  { label: 'Shop', href: '/products' },
  { label: 'Orders', href: '/orders' },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const count = cart.hydrated ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <>
      <div className="announcement">
        <span>Merc / everyday goods</span>
        <span>Prices in ETB · Checkout with StarPay</span>
      </div>
      <header className="site-header">
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
            <Link
              href="/products?focus=search"
              className="icon-button search-action"
              aria-label="Search products"
            >
              <Search size={20} strokeWidth={1.7} />
            </Link>
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
          <p>Home goods, accessories and useful pieces for daily life.</p>
          <Link className="footer-cta" href="/products">
            Browse all products <ArrowUpRight size={17} />
          </Link>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <div>
            <span className="footer-title">Shop</span>
            <Link href="/products?category=home">Home & living</Link>
            <Link href="/products?category=accessories">Accessories</Link>
            <Link href="/products?category=essentials">Everyday essentials</Link>
          </div>
          <div>
            <span className="footer-title">Help & account</span>
            <Link href="/help">Help</Link>
            <Link href="/orders">Orders</Link>
            <Link href="/cart">Shopping bag</Link>
            <Link href="/auth/forgot-password">Password help</Link>
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
