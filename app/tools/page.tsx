import type { Metadata } from 'next';
import { RevealInit } from '@/components/reveal-init';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import {
  getToolsPageData,
  getToolsResourceCards,
  getToolsVideos,
} from '@/lib/tools';
import { ToolsContent } from './content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getToolsPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function ToolsPage() {
  const [{ meta, banner }, resources, videoData] = await Promise.all([
    getToolsPageData(),
    getToolsResourceCards(),
    getToolsVideos(),
  ]);

  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="reveal about-hero tools-hero container">
        <HeroMedia
          src={banner.image}
          poster={banner.poster}
          alt={banner.alt || meta.title}
          priority
        />
        <HeroBannerCopy title={banner.title} subtitle={banner.subtitle} />
      </section>
      <ToolsContent
        resources={resources}
        videoHeading={videoData.heading}
        videos={videoData.videos}
      />
    </main>
  );
}
