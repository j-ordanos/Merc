import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { getProducts } from '@/server/catalog';
import { ProductGrid } from '@/features/catalog/components';
import { categories } from '@/features/catalog/data';
import { money } from '@/lib/money';
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
  const heroProduct = featured[0] || products[0];

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
        {heroProduct && (
          <Link
            href={`/products/${heroProduct.slug}`}
            className="home-hero-image"
            aria-label={`View ${heroProduct.name}`}
          >
            <Image
              src={heroProduct.image_url}
              alt={heroProduct.image_alt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 55vw"
            />
            <div className="home-hero-image-note">
              <span>
                <strong>{heroProduct.name}</strong>
                <small>{money(heroProduct.price_minor)}</small>
              </span>
              <ArrowUpRight size={20} />
            </div>
          </Link>
        )}
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

      <section className="section container home-categories" aria-labelledby="categories-title">
        <div className="section-heading" data-reveal>
          <div>
            <span className="eyebrow">FIND YOUR WAY IN</span>
            <h2 id="categories-title">Shop by category</h2>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-card"
              data-reveal
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
