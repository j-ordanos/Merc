import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { getProducts } from '@/server/catalog';
import { ProductGrid } from '@/features/catalog/components';
import { Benefits } from '@/components/shell';
import { categories } from '@/features/catalog/data';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = await getProducts();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="tiny-line" /> WELL CHOSEN. WELL LOVED.
          </div>
          <h1>
            Good things.
            <br />
            For your <em>everyday.</em>
          </h1>
          <p>
            Thoughtful pieces for the spaces you live in
            <br className="desktop-only" /> and the moments that make them yours.
          </p>
          <Link href="/products" className="button hero-button">
            Explore the collection <ArrowUpRight size={18} />
          </Link>
          <div className="hero-footnote">
            <span className="mini-star">✳</span> A little less ordinary. A little more you.
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=90"
            alt="A sunlit living room with natural wood furniture, soft cushions, and warm neutral tones"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 55vw"
          />
          <div className="hero-image-label">
            <span>THE EVERYDAY EDIT</span>
            <ArrowUpRight size={20} />
          </div>
          <div className="hero-stamp">
            LESS, BUT
            <br />
            <span>better.</span>
            <Sparkles size={16} />
          </div>
        </div>
      </section>
      <Benefits />
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR EVERYDAY</span>
            <h2>A place for everything you love.</h2>
          </div>
          <span className="section-aside">Small details. A world of difference.</span>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => (
            <Link
              className={`category-card category-${c.id}`}
              key={c.id}
              href={`/products?category=${c.id}`}
            >
              <div className="category-image">
                <Image
                  src={products[[4, 8, 13][i]]?.image_url || products[0].image_url}
                  alt={c.name}
                  fill
                  sizes="(max-width: 600px) 90vw, 33vw"
                />
              </div>
              <div className="category-copy">
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                </div>
                <span className="round-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section container favorites">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE GOOD STUFF</span>
            <h2>Meet your new favorites.</h2>
          </div>
          <Link href="/products" className="text-link">
            Shop all pieces <ArrowRight size={17} />
          </Link>
        </div>
        <ProductGrid products={products.filter((p) => p.featured).slice(0, 4)} />
      </section>
      <section className="story-banner container">
        <div className="story-visual">
          <Image
            src="https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=1200&q=85"
            alt="Natural textures and thoughtful objects in a quiet home"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="story-copy">
          <span className="eyebrow">THE MERC WAY</span>
          <h2>
            Fewer things.
            <br />
            <em>More meaning.</em>
          </h2>
          <p>
            We believe the best things are the ones you reach for, again and again. Beautifully
            useful, quietly special, and made to feel like you.
          </p>
          <Link href="/about" className="text-link">
            A little about us <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="closing-note container">
        <span className="mini-star">✳</span>
        <p>Make room for the everyday extraordinary.</p>
        <Link href="/products" className="text-link">
          Find your next good thing <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}
