'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/http';
import type { SessionUser } from '@/lib/types';
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () =>
      (await api.get<{ user: SessionUser | null; configured: boolean }>('/auth/session')).data,
    retry: false,
  });
}
