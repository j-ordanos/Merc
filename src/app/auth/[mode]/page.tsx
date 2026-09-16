import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AuthForm } from '@/features/auth/auth-form';
export const metadata = { title: 'Your account' };
export default async function Auth({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (
    mode !== 'login' &&
    mode !== 'signup' &&
    mode !== 'forgot-password' &&
    mode !== 'reset-password'
  )
    notFound();
  return (
    <div className="container page-section">
      <Suspense>
        <AuthForm mode={mode} />
      </Suspense>
    </div>
  );
}
