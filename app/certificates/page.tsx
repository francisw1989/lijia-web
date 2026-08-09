import type { Metadata } from 'next';
import Image from 'next/image';
import { RevealInit } from '@/components/reveal-init';
import { getCertificatesPageData } from '@/lib/certificates';
import { isCmsAssetUrl } from '@/lib/cms-asset';

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
        <Image
          src={banner.image}
          alt={banner.alt || meta.title}
          fill
          priority
          unoptimized={isCmsAssetUrl(banner.image)}
          className="object-cover"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />
      </section>
      <section className="container mt48">
        <Image
          src="/images/13.png"
          alt={meta.title}
          width={906}
          height={835}
          className="auto"
        />
      </section>
    </main>
  );
}
