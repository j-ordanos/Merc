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
        <span className="eyebrow">THE COLLECTION</span>
        <h1>Shop all products</h1>
        <p>Browse home goods, accessories and everyday essentials.</p>
      </div>
      <Suspense fallback={<p>Opening the collection…</p>}>
        <Catalog initialProducts={products} />
      </Suspense>
    </div>
  );
}
