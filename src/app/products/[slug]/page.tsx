import { notFound } from 'next/navigation';
import { getProduct, getProducts } from '@/server/catalog';
import { ProductDetail, ProductGrid } from '@/features/catalog/components';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  return { title: p?.name || 'Product not found' };
}
export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const related = (await getProducts())
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  return (
    <div className="container page-section">
      <ProductDetail product={product} />
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">IN GOOD COMPANY</span>
            <h2>A few more things to love.</h2>
          </div>
        </div>
        <ProductGrid products={related} />
      </section>
    </div>
  );
}
