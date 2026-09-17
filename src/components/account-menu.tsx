'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, UserRound } from 'lucide-react';
import { useSession } from '@/features/auth/use-session';
import { api, errorMessage } from '@/lib/http';
import { Notice } from '@/components/ui';

export function AccountMenu() {
  const session = useSession();
  const path = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const user = session.data?.user;
  const email = user?.email || '';
  const initials = email.slice(0, 2).toUpperCase() || 'ME';

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>('.account-trigger')?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function signOut() {
    setError('');
    setSigningOut(true);
    try {
      await api.post('/auth/logout');
      queryClient.clear();
      setOpen(false);
      router.push('/');
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      setSigningOut(false);
    }
  }

  if (!user)
    return (
      <Link
        href={`/auth/login?next=${encodeURIComponent(path.startsWith('/auth/') ? '/orders' : path)}`}
        className="icon-button account-guest"
        aria-label="Sign in"
      >
        <UserRound size={20} strokeWidth={1.7} />
      </Link>
    );

  return (
    <div className="account-menu-root" ref={root}>
      <button
        type="button"
        className="account-trigger"
        aria-label={`Account menu for ${email}`}
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => {
          setOpen((current) => !current);
          setError('');
        }}
      >
        {initials}
      </button>
      {open && (
        <div className="account-dropdown" id="account-menu" aria-label="Your account">
          <p className="account-dropdown-email">{email}</p>
          {error && <Notice error>{error}</Notice>}
          <button
            type="button"
            className="account-dropdown-signout"
            disabled={signingOut}
            onClick={signOut}
          >
            <LogOut size={17} /> {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
