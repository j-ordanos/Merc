import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';

export const metadata = { title: 'Terms of use' };

export default function Terms() {
  return (
    <InfoPage
      eyebrow="STORE TERMS"
      title="Terms of use"
      intro="These terms describe how the Merc sandbox storefront works. Review them before using checkout."
    >
      <InfoSection title="Using Merc">
        <p>
          Browse products for personal use, provide accurate account and checkout details, and use
          the site without disrupting it or other visitors. An account is required for checkout and
          private order history.
        </p>
      </InfoSection>
      <InfoSection title="Products and prices">
        <p>
          Product descriptions, availability and prices are shown in Ethiopian birr. The price and
          items shown during checkout are the basis of the order you submit. If information appears
          incorrect, stop before paying and use the help information.
        </p>
      </InfoSection>
      <InfoSection title="Sandbox payments">
        <p>
          Merc currently uses StarPay sandbox checkout. The flow is for testing and does not
          represent a live sale. Follow the sandbox instructions and do not enter real payment
          credentials or a real phone number. An order is marked paid only after server-side payment
          confirmation.
        </p>
      </InfoSection>
      <InfoSection title="Order status">
        <p>
          If your order remains pending or a payment result cannot be confirmed, open its order page
          and use “Check payment status” before starting another payment. The order page is the
          place to review the latest status.
        </p>
      </InfoSection>
      <InfoSection title="Questions and changes">
        <p>
          Read the <Link href="/help">Help center</Link> for shopping guidance. These sample store
          terms should be reviewed and completed with real operator, fulfillment and support details
          before a live launch.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
