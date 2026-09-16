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
  console.error('Merc request failed:', error instanceof Error ? error.name : 'UnknownError');
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
