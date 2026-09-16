'use client';
import { Form, Formik } from 'formik';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { emailSchema, loginSchema, passwordSchema, safeNext, signupSchema } from '@/lib/validation';
import { api, errorMessage } from '@/lib/http';
import { FormField, Notice, Spinner } from '@/components/ui';
type Mode = 'login' | 'signup' | 'forgot-password' | 'reset-password';
const copy = {
  login: ['Welcome back.', 'A few good things are waiting for you.', 'Sign in'],
  signup: [
    'Make yourself at home.',
    'Create an account for a more considered everyday.',
    'Create account',
  ],
  'forgot-password': [
    'A fresh start.',
    'We’ll send you a link to reset your password.',
    'Send reset link',
  ],
  'reset-password': [
    'Something new.',
    'Choose a new password for your Merc account.',
    'Save new password',
  ],
};
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const query = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const next = safeNext(params.get('next'));
  const [title, description, submit] = copy[mode];
  return (
    <div className="auth-layout">
      <div className="auth-aside">
        <span className="eyebrow">GOOD TO HAVE YOU HERE</span>
        <h2>
          Your everyday,
          <br />
          <em>a little better.</em>
        </h2>
        <p>
          Thoughtful pieces.
          <br />A space that feels like you.
        </p>
        <span className="auth-flower">✳</span>
      </div>
      <div className="auth-content">
        <Link href="/products" className="back-link">
          <ArrowLeft size={15} /> Back to the collection
        </Link>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
        {params.get('error') === 'confirmation' && (
          <Notice error>
            That link has expired or was already used. Try signing in or request a new password
            reset.
          </Notice>
        )}
        {success ? (
          <>
            <Notice>{success}</Notice>
            <Link className="text-link" href={`/auth/login?next=${encodeURIComponent(next)}`}>
              Back to sign in <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={
              mode === 'signup'
                ? signupSchema
                : mode === 'forgot-password'
                  ? emailSchema
                  : mode === 'reset-password'
                    ? passwordSchema
                    : loginSchema
            }
            onSubmit={async (values) => {
              setError('');
              try {
                await api.post(`/auth/${mode}`, { ...values, next });
                if (mode === 'signup')
                  setSuccess(
                    'Check your email to confirm your account, then come back to sign in.',
                  );
                else if (mode === 'forgot-password')
                  setSuccess('If an account exists for that email, a reset link is on its way.');
                else {
                  await query.invalidateQueries({ queryKey: ['session'] });
                  router.push(mode === 'reset-password' ? '/orders' : next);
                  router.refresh();
                }
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="auth-form">
                {mode !== 'reset-password' && (
                  <FormField
                    name="email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                )}
                {mode !== 'forgot-password' && (
                  <FormField
                    name="password"
                    label={mode === 'reset-password' ? 'New password' : 'Password'}
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'login' ? 'Your password' : 'At least 10 characters'}
                  />
                )}{' '}
                {mode === 'login' && (
                  <Link className="forgot-link" href="/auth/forgot-password">
                    Forgot your password?
                  </Link>
                )}
                {error && <Notice error>{error}</Notice>}
                <button className="button full-width" type="submit" disabled={isSubmitting}>
                  {submit}
                  {isSubmitting ? <Spinner /> : <ArrowRight size={17} />}
                </button>
              </Form>
            )}
          </Formik>
        )}
        {!success && (mode === 'login' || mode === 'signup') && (
          <p className="auth-switch">
            {mode === 'login' ? 'New around here?' : 'Already at home here?'}{' '}
            <Link
              href={`/auth/${mode === 'login' ? 'signup' : 'login'}?next=${encodeURIComponent(next)}`}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
