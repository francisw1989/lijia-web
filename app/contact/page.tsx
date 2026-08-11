import type { Metadata } from 'next';
import { RevealInit } from '@/components/reveal-init';
import { HeroMedia } from '@/components/hero-media';
import { getContactPageData } from '@/lib/contact';
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
      <section className="reveal about-hero">
        <HeroMedia
          src={banner.image}
          alt={banner.alt || meta.title}
          priority
        />
      </section>
      <ContactContent />
    </main>
  );
}
