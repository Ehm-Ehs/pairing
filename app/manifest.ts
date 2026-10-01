import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let host = '';
  try {
    const headersList = await headers();
    host = headersList.get('host') || '';
  } catch {
    // Fallback if headers are unavailable
  }

  const isDevelop =
    process.env.NEXT_PUBLIC_APP_ENV === 'develop' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
    process.env.VERCEL_ENV === 'preview' ||
    host.toLowerCase().includes('develop') ||
    host.toLowerCase().includes('dev') ||
    host.toLowerCase().includes('staging') ||
    host.toLowerCase().includes('stag');

  const name = isDevelop ? 'Pairform-dev' : 'PairForm - Simple, Fair Grouping';
  const short_name = isDevelop ? 'Pairform-dev' : 'PairForm';
  const theme_color = isDevelop ? '#f59e0b' : '#3b82f6';

  return {
    name,
    short_name,
    description: isDevelop
      ? 'PairForm Develop testing environment for automated team pairing.'
      : 'Smart automated group generator, team balancing, and Secret Santa matching without chaos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color,
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
