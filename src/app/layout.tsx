import type { Metadata } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header, Footer } from '@/components/shell';
import { ToastViewport } from '@/components/toast';
import { NavigationEffects } from '@/components/navigation-effects';
import { siteOrigin } from '@/lib/seo';
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: 'Merc',
  title: { default: 'Merc | Home goods and everyday essentials', template: '%s | Merc' },
  description: 'Shop home goods, bags and everyday essentials in Ethiopian birr at Merc.',
  robots: process.env.VERCEL_ENV === 'preview' ? { index: false, follow: false } : undefined,
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <NavigationEffects />
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
