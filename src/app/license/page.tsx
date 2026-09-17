import Link from 'next/link';
import { InfoPage, InfoSection } from '@/components/info-page';

export const metadata = { title: 'License and agreement' };

export default function License() {
  return (
    <InfoPage
      eyebrow="USE OF MERC"
      title="License & agreement"
      intro="A plain-language guide to using the Merc storefront and its content."
    >
      <InfoSection title="Use of the storefront">
        <p>
          You may use the site to browse the catalog, build a bag and try the sandbox checkout for
          its intended purpose. This permission does not transfer ownership of the software, brand,
          product text or images.
        </p>
      </InfoSection>
      <InfoSection title="Code and content">
        <p>
          No general open-source license is granted for the Merc application by this page. Images,
          fonts, libraries and payment services can have their own separate terms and licenses.
          Their inclusion does not change those terms.
        </p>
      </InfoSection>
      <InfoSection title="Your agreement">
        <p>
          By using Merc, you agree to use the storefront responsibly and follow the{' '}
          <Link href="/terms">Terms of use</Link>. This is a sample agreement for the demonstration
          and needs review before the store becomes a live commercial service.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
