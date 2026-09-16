import 'server-only';
import { NextResponse } from 'next/server';
import { ValidationError } from 'yup';
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public orderId?: string,
  ) {
    super(message);
  }
}
export function fail(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(code)) {
    console.error('Merc database setup incomplete', {
      code,
      action: 'Apply supabase/migrations/202609160001_store.sql, then run npm run db:seed.',
    });
    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_NOT_READY',
          message:
            'The store’s database setup is incomplete. Checkout will be available after setup is finished.',
        },
      },
      { status: 503 },
    );
  }
  if (code === '42501' || code === 'PGRST301' || code === 'PGRST302') {
    console.error('Merc database access failed', {
      code,
      action: 'Check the server-side Supabase credentials and grants.',
    });
    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_ACCESS',
          message: 'The store cannot access its order service right now. Please try again later.',
        },
      },
      { status: 503 },
    );
  }
  if (error instanceof ValidationError)
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION',
          message: error.errors[0],
          fields: Object.fromEntries(error.inner.map((e) => [e.path, e.message])),
        },
      },
      { status: 400 },
    );
  if (error instanceof AppError)
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.orderId ? { orderId: error.orderId } : {}),
        },
      },
      { status: error.status },
    );
  // Never log upstream response bodies, credentials, or delivery details.
  console.error('Merc request failed:', {
    name: error instanceof Error ? error.name : 'UnknownError',
    ...(/^[A-Z0-9_]{1,40}$/.test(code) ? { code } : {}),
  });
  return NextResponse.json(
    {
      error: { code: 'INTERNAL', message: 'We couldn’t complete that request. Please try again.' },
    },
    { status: 500 },
  );
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : new URL(request.url).origin;
  if (!origin || origin !== expected)
    throw new AppError(403, 'ORIGIN', 'This request is not allowed.');
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 32768) throw new AppError(413, 'BODY_TOO_LARGE', 'The request is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'Invalid request.');
  }
}
