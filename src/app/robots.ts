import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/cart', '/checkout', '/orders'],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
