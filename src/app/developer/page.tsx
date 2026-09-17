import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  '/developer',
  'About the developer',
  'Learn about the Merc storefront project and its approach to shopping and checkout.',
);

export default function Developer() {
  return (
    <InfoPage
      eyebrow="BEHIND THE STORE"
      title="Built for a clearer shopping journey."
      intro="Merc is a mini e-commerce project made to connect product discovery, a shopping bag, checkout and order tracking in one place."
    >
      <InfoSection title="The project">
        <p>
          Merc was developed as a frontend technical challenge. Its design focuses on readable
          product information, direct navigation and a checkout flow that keeps payment
          initialization on the server.
        </p>
      </InfoSection>
      <InfoSection title="The developer">
        <p>
          <strong>Merc project team</strong> is sample public credit for this demonstration. Replace
          this with the developer or business name you want visitors to see before launch.
        </p>
      </InfoSection>
      <InfoSection title="Questions">
        <p>
          For shopping guidance, visit the <Link href="/help">Help center</Link>. The sample contact
          details there should be replaced with an active support channel before launch.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
