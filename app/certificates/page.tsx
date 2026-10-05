import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/site-title';
import { RevealInit } from '@/components/reveal-init';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { getCertificatesPageData } from '@/lib/certificates';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import Image from 'next/image';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getCertificatesPageData();
  return pageMetadata({
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  });
}

export default async function CertificatesPage() {
  const { meta, banner, items } = await getCertificatesPageData();

  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="reveal about-hero container">
        <HeroMedia
          src={banner.image}
          poster={banner.poster}
          alt={banner.alt || meta.title}
          priority
          mask={true}
        />
        <HeroBannerCopy title={banner.title} subtitle={banner.subtitle} />
      </section>
      <section className="reveal container certificates-intro">
        <div className="certificates-intro-inner">
          <p>
            Lijia games are certified by ICTI, GSV, FSC, Disney, ISO9001. As an important toy and game manufacturer, Lijia Game has always supported and adhered to the ICTI CARE process and is an authorized long-term manufacturer partner of Hasbro, Disney, Walmart, TJX, etc.
          </p>
        </div>
      </section>
      {items.length ? (
        <section className="container mt48 certificates-logos" aria-label="Certificates and partners">
          <ul className="certificates-gallery">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="certificates-logo" title={item.title}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={280}
                    height={180}
                    unoptimized={isCmsAssetUrl(item.image)}
                    className="certificates-logo-img"
                    sizes="(max-width: 800px) 45vw, 220px"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
