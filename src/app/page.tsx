import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getProducts } from '@/server/catalog';
import { ProductGrid } from '@/features/catalog/components';
import { categories } from '@/features/catalog/data';

export const dynamic = 'force-dynamic';

const categoryImages = {
  home: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85',
  accessories:
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1100&q=85',
  essentials:
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1100&q=85',
};

export default async function Home() {
  const products = await getProducts();
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const picks = products.filter((product) =>
    ['scented-candle', 'everyday-tote', 'steel-water-bottle', 'travel-journal'].includes(
      product.slug,
    ),
  );
  const moreProducts = [
    ...picks,
    ...products.filter((product) => !featured.includes(product) && !picks.includes(product)),
  ].slice(0, 4);

  return (
    <>
      <section className="home-hero container" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <span className="eyebrow">THE MERC COLLECTION</span>
          <h1 id="home-title">Useful pieces for home and beyond.</h1>
          <p>Browse home goods, bags and stationery in one small, practical collection.</p>
          <div className="home-hero-actions">
            <Link href="/products" className="button">
              Shop all products <ArrowRight size={18} />
            </Link>
            <Link href="/products?category=home" className="text-link">
              Browse home goods <ArrowUpRight size={17} />
            </Link>
          </div>
          <span className="home-hero-caption">{products.length} products · Prices in ETB</span>
        </div>
        <div className="home-hero-image">
          <Image
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=90"
            alt="Living room with a sofa, coffee table and natural light"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 55vw"
          />
          <div className="home-hero-image-note">
            Home & living <ArrowUpRight size={17} />
          </div>
        </div>
      </section>

      <section className="section container home-products" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">START HERE</span>
            <h2 id="featured-title">Featured products</h2>
          </div>
          <Link href="/products" className="text-link">
            View all <ArrowRight size={17} />
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      <section className="section container home-categories" aria-labelledby="categories-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR WAY IN</span>
            <h2 id="categories-title">Shop by category</h2>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-card"
              key={category.id}
              href={`/products?category=${category.id}`}
            >
              <div className="category-image">
                <Image
                  src={categoryImages[category.id]}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 90vw, 33vw"
                />
              </div>
              <div className="category-copy">
                <h3>{category.name}</h3>
                <span className="round-arrow">
                  <ArrowUpRight size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-service" aria-labelledby="service-title">
        <div className="container home-service-inner">
          <div>
            <span className="eyebrow">BEFORE YOU CHECK OUT</span>
            <h2 id="service-title">A note about checkout</h2>
          </div>
          <div>
            <p>Pay through StarPay and follow your order status after checkout.</p>
            <Link href="/help" className="text-link">
              Payment and order help <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section container home-products home-latest"
        aria-labelledby="latest-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">MORE TO EXPLORE</span>
            <h2 id="latest-title">From the collection</h2>
          </div>
          <Link href="/products" className="text-link">
            Shop the collection <ArrowRight size={17} />
          </Link>
        </div>
        <ProductGrid products={moreProducts} />
      </section>
    </>
  );
}
