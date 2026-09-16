import { NextResponse } from 'next/server';
import { getProduct } from '@/server/catalog';
import { AppError, fail } from '@/server/errors';
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const product = await getProduct((await params).slug);
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found.');
    return NextResponse.json({ product });
  } catch (e) {
    return fail(e);
  }
}
