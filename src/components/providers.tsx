'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useCart } from '@/features/cart/store';
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    try {
      useCart.persist.rehydrate();
    } catch {
      useCart.getState().hydrate();
      return;
    }
    useCart.getState().hydrate();
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
