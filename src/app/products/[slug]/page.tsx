import { notFound } from 'next/navigation';
import { getProduct, getProducts } from '@/server/catalog';
import { ProductDetail, ProductGrid } from '@/features/catalog/components';
import type { Metadata } from 'next';
import { siteOrigin } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } };
  const path = `/products/${product.slug}`;
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Merc',
      title: `${product.name} | Merc`,
      description: product.description,
      url: new URL(path, siteOrigin()).toString(),
      images: [{ url: product.image_url, alt: product.image_alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Merc`,
      description: product.description,
      images: [{ url: product.image_url, alt: product.image_alt }],
    },
  };
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
