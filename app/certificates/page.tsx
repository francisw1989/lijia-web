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
        />
        <HeroBannerCopy title={banner.title} subtitle={banner.subtitle} />
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
