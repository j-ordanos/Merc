import { NextResponse } from 'next/server';
import { supabase, requireUser } from '@/server/supabase';
import { AppError, assertSameOrigin, fail, jsonBody } from '@/server/errors';
import { emailSchema, loginSchema, passwordSchema, safeNext, signupSchema } from '@/lib/validation';
import { appUrl } from '@/server/config';
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    assertSameOrigin(request);
    const { action } = await params;
    const db = await supabase();
    if (action === 'logout') {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    const body = await jsonBody(request);
    if (action === 'login') {
      const values = await loginSchema.validate(body);
      const { error } = await db.auth.signInWithPassword(values);
      if (error)
        throw new AppError(
          400,
          'LOGIN_FAILED',
          'Check your email and password, and confirm your email before signing in.',
        );
    } else if (action === 'signup') {
      const values = await signupSchema.validate(body);
      const next = safeNext(body.next);
      const { error } = await db.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error)
        throw new AppError(
          400,
          'SIGNUP_FAILED',
          'We couldn’t create your account. Check your details or try again later.',
        );
    } else if (action === 'forgot-password') {
      const values = await emailSchema.validate(body);
      const { error } = await db.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${appUrl()}/auth/callback?next=/auth/reset-password`,
      });
      if (error)
        throw new AppError(
          429,
          'RESET_FAILED',
          'Please wait a moment before requesting another reset link.',
        );
    } else if (action === 'reset-password') {
      await requireUser();
      const values = await passwordSchema.validate(body);
      const { error } = await db.auth.updateUser(values);
      if (error)
        throw new AppError(
          400,
          'RESET_FAILED',
          'This reset link may have expired. Request a new one.',
        );
    } else throw new AppError(404, 'NOT_FOUND', 'Not found.');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
