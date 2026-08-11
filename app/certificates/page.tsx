import type { Metadata } from 'next';
import { RevealInit } from '@/components/reveal-init';
import { HeroMedia } from '@/components/hero-media';
import { getCertificatesPageData } from '@/lib/certificates';
import { isCmsAssetUrl } from '@/lib/cms-asset';
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
      <section className="reveal about-hero">
        <HeroMedia
          src={banner.image}
          alt={banner.alt || meta.title}
          priority
        />
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
