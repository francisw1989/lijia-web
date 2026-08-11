import type { Metadata } from 'next';
import { RevealInit } from '@/components/reveal-init';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { getProjectPageData } from '@/lib/project';
import { ProjectContent } from './content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getProjectPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function StartAProjectPage() {
  const { meta, banner } = await getProjectPageData();

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
      <ProjectContent />
    </main>
  );
}
