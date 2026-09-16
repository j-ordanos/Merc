import { Suspense } from 'react';
import { getProducts } from '@/server/catalog';
import { Catalog } from '@/features/catalog/components';
export const metadata = { title: 'The collection' };
export const dynamic = 'force-dynamic';
export default async function Products() {
  const products = await getProducts();
  return (
    <div className="container page-section">
      <div className="page-heading">
        <span className="eyebrow">THE MERC COLLECTION</span>
        <h1>
          Good things, <em>all in one place.</em>
        </h1>
        <p>Considered pieces. Everyday purpose. Find a little something that feels like you.</p>
      </div>
      <Suspense fallback={<p>Opening the collection…</p>}>
        <Catalog initialProducts={products} />
      </Suspense>
    </div>
  );
}
