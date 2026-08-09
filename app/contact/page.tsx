import type { Metadata } from 'next';
import Image from 'next/image';
import { RevealInit } from '@/components/reveal-init';
import { getContactPageData } from '@/lib/contact';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import { ContactContent } from './content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getContactPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function ContactPage() {
  const { meta, banner } = await getContactPageData();

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
      <ContactContent />
    </main>
  );
}
