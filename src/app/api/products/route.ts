import { NextResponse } from 'next/server';
import { getProducts } from '@/server/catalog';
import { fail } from '@/server/errors';
export async function GET() {
  try {
    return NextResponse.json({ products: await getProducts() });
  } catch (e) {
    return fail(e);
  }
}
