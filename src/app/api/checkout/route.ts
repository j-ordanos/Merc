import { NextResponse } from 'next/server';
import { checkoutSchema } from '@/lib/validation';
import { assertSameOrigin, fail, jsonBody } from '@/server/errors';
import { requireUser } from '@/server/supabase';
import { checkout } from '@/server/orders';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await checkoutSchema.validate(await jsonBody(request), {
      abortEarly: false,
      strict: true,
    });
    return NextResponse.json(await checkout(user.id, input));
  } catch (e) {
    return fail(e);
  }
}
