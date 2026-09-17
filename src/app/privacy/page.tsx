import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  '/privacy',
  'Privacy',
  'How Merc uses account, bag, checkout and order information.',
);

export default function Privacy() {
  return (
    <InfoPage
      eyebrow="YOUR INFORMATION"
      title="Privacy at Merc"
      intro="This page explains the information this storefront uses as you browse, sign in and place an order."
    >
      <InfoSection title="What you provide">
        <p>
          For an account, you provide an email address and password. At checkout, Merc asks for your
          name, email, phone number, city, address and optional delivery instructions. Orders also
          record items, prices and payment status.
        </p>
      </InfoSection>
      <InfoSection title="How it is used">
        <p>
          Account details let you sign in and see your own orders. Checkout details create the order
          and support payment initialization. Order records let the site show your purchase and
          check its payment status.
        </p>
      </InfoSection>
      <InfoSection title="Storage and providers">
        <p>
          Merc uses Supabase for authentication and store records. StarPay handles the hosted
          sandbox payment page and receives details needed to initialize and verify payment. Payment
          keys stay on the server. Your bag is stored in this browser’s local storage, and
          authentication uses cookies.
        </p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>
          You can remove items from your bag or clear this site’s local browser data. Sign out from
          the account menu when using a shared device. Order records are connected to your account;
          the site does not currently offer an in-app account or order deletion button.
        </p>
      </InfoSection>
      <InfoSection title="Questions">
        <p>
          See the <Link href="/help#contact">contact details</Link> for this project. This policy
          contains sample operator information and should be reviewed for the intended live service
          before launch.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
