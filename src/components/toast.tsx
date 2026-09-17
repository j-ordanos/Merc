'use client';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';
import { create } from 'zustand';

type Toast = { id: number; message: string; href?: string; action?: string } | null;
type ToastState = {
  toast: Toast;
  show: (message: string, href?: string, action?: string) => void;
  clear: () => void;
};

export const useToast = create<ToastState>((set) => ({
  toast: null,
  show: (message, href, action) => set({ toast: { id: Date.now(), message, href, action } }),
  clear: () => set({ toast: null }),
}));

export function ToastViewport() {
  const toast = useToast((state) => state.toast);
  const clear = useToast((state) => state.clear);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(clear, 3500);
    return () => window.clearTimeout(timeout);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <Check size={18} aria-hidden="true" />
      <span>{toast.message}</span>
      {toast.href && (
        <Link href={toast.href} onClick={clear}>
          {toast.action || 'View'}
        </Link>
      )}
      <button type="button" onClick={clear} aria-label="Dismiss notification">
        <X size={17} />
      </button>
    </div>
  );
}
