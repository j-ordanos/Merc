import 'server-only';
import type { Metadata } from 'next';

const fallbackOrigin = 'https://merc-lac.vercel.app';
const socialImageAlt = 'Merc — home goods, bags and everyday essentials';

export function siteOrigin() {
  try {
    return new URL(process.env.APP_URL || fallbackOrigin).origin;
  } catch {
    return fallbackOrigin;
  }
}

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  const image = new URL('/opengraph-image', siteOrigin()).toString();
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Merc',
      title: `${title} | Merc`,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: socialImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Merc`,
      description,
      images: [{ url: image, alt: socialImageAlt }],
    },
  };
}
