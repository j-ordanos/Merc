import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  '/story',
  'Our story',
  'Why Merc was built and what you can expect from the storefront.',
);

export default function Story() {
  return (
    <InfoPage
      eyebrow="ABOUT MERC"
      title="A simpler place to shop."
      intro="Merc brings a small collection of home goods, accessories and everyday essentials together in one straightforward storefront."
    >
      <InfoSection title="Why Merc exists">
        <p>
          Finding a useful product should feel easy: see the item, know its price, understand the
          next step and keep track of the order. Merc was built around that simple shopping journey.
        </p>
        <p>
          The storefront began as a mini e-commerce project. It now brings product browsing, a saved
          bag, account access, checkout and order status into one experience.
        </p>
      </InfoSection>
      <InfoSection title="Made for everyday decisions">
        <p>
          Prices are shown in Ethiopian birr. You can browse by category or search by product name,
          read the item details and decide what belongs in your bag. The checkout connects to
          StarPay, and your order page shows payment status after the server checks it.
        </p>
      </InfoSection>
      <InfoSection title="What to expect">
        <p>
          Clear product information, visible prices and a path back to your orders. This is a
          sandbox storefront, so the StarPay checkout uses a test payment flow while the shopping
          experience is being refined.
        </p>
        <Link className="button" href="/products">
          Explore the collection →
        </Link>
      </InfoSection>
    </InfoPage>
  );
}
