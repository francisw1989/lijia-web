import type { Metadata } from 'next';
import { League_Spartan } from 'next/font/google';
import { JsonLd } from '@/components/json-ld';
import { ScrollToTop } from '@/components/scroll-to-top';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import './globals.scss';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <ScrollToTop />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
