import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getProducts } from '@/server/catalog';
import { ProductGrid } from '@/features/catalog/components';
import { categories } from '@/features/catalog/data';
import { publicPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata = publicPageMetadata(
  '/',
  'Home goods and everyday essentials',
  'Shop home goods, bags, stationery and everyday essentials in Ethiopian birr at Merc.',
);

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
        <div className="home-hero-copy" data-reveal>
          <span className="eyebrow">SHOP MERC · PRICES IN ETB</span>
          <h1 id="home-title">Good things for home and everyday life.</h1>
          <p>
            Shop home goods, bags and everyday essentials. Add what you like to your bag and pay
            through StarPay.
          </p>
          <div className="home-hero-actions">
            <Link href="/products" className="button">
              Shop all products <ArrowRight size={18} />
            </Link>
            <Link href="/docs" className="text-link">
              How shopping works <ArrowUpRight size={17} />
            </Link>
          </div>
          <span className="home-hero-caption">
            {products.length} products across three categories
          </span>
        </div>
        <div className="home-hero-tiles" aria-label="Shop by category">
          {categories.map((category, index) => (
            <Link
              href={`/products?category=${category.id}`}
              className="home-hero-tile"
              key={category.id}
            >
              <Image
                src={categoryImages[category.id]}
                alt=""
                fill
                priority={index === 0}
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 25vw, 30vw"
              />
              <span className="home-hero-tile-label">
                {category.name} <ArrowUpRight size={19} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container home-products" aria-labelledby="featured-title">
        <div className="section-heading" data-reveal>
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

      <section className="container home-promo-wrap" aria-label="New season picks">
        <Link className="home-promo" href="/products?collection=new-season">
          <span className="home-promo-kicker">THE SEASON EDIT</span>
          <span className="home-promo-title">New season picks</span>
          <span className="home-promo-copy">A fresh look at home and everyday favorites.</span>
          <span className="home-promo-action">
            Shop the edit <ArrowRight size={18} />
          </span>
        </Link>
      </section>

      <section className="home-service" aria-labelledby="service-title">
        <div className="container home-service-inner" data-reveal>
          <div>
            <span className="eyebrow">READY WHEN YOU ARE</span>
            <h2 id="service-title">From your bag to payment, simply.</h2>
          </div>
          <div>
            <p>
              Choose your pieces, review your order and complete payment on StarPay. Your order page
              shows the latest payment status.
            </p>
            <Link href="/docs" className="text-link">
              See how it works <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="section container home-products home-latest"
        aria-labelledby="latest-title"
      >
        <div className="section-heading" data-reveal>
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
