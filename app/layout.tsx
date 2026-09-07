import type { Metadata } from 'next';
import { League_Spartan } from 'next/font/google';
import { JsonLd } from '@/components/json-ld';
import { CookieConsent } from '@/components/cookie-consent';
import { ScrollToTop } from '@/components/scroll-to-top';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getHomepageSettings } from '@/lib/homepage';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { getSiteUrl } from '@/lib/site';
import './globals.scss';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getHomepageSettings();
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: seo.title,
      // 兜底：未显式设置 absolute 的页面仍套上首页标题
      template: `${seo.title} · %s`,
    },
    description: seo.description,
    keywords: seo.keywords || undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { seo } = await getHomepageSettings();

  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body>
        <JsonLd
          data={[
            organizationSchema({
              name: seo.title,
              description: seo.description,
            }),
            websiteSchema({
              name: seo.title,
              description: seo.description,
            }),
          ]}
        />
        <ScrollToTop />
        <SiteHeader />
        {children}
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
