import type { Metadata } from 'next';
import { RevealInit } from '@/components/reveal-init';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { getCertificatesPageData } from '@/lib/certificates';
import Image from 'next/image';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getCertificatesPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function CertificatesPage() {
  const { meta, banner } = await getCertificatesPageData();

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
      <section className="container mt48 certificates-logos">
        <Image
          src="/images/13.png"
          alt={meta.title}
          width={906}
          height={835}
          className="certificates-logos-img"
          sizes="(max-width: 1400px) 100vw, 906px"
        />
      </section>
    </main>
  );
}
