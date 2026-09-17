import type { MetadataRoute } from 'next';
import { getProducts } from '@/server/catalog';
import { siteOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const pages = [
    '/',
    '/products',
    '/story',
    '/docs',
    '/help',
    '/developer',
    '/terms',
    '/privacy',
    '/license',
  ];
  const products = await getProducts();
  return [
    ...pages.map((path) => ({ url: new URL(path, origin).toString() })),
    ...products.map((product) => ({
      url: new URL(`/products/${product.slug}`, origin).toString(),
    })),
  ];
}
