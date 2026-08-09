import type { Metadata } from 'next';
import Image from 'next/image';
import { RevealInit } from '@/components/reveal-init';
import {
  getToolsPageData,
  getToolsResourceCards,
  getToolsVideos,
} from '@/lib/tools';
import { isCmsAssetUrl } from '@/lib/cms-asset';
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
        <Image
          src={banner.image}
          alt={banner.alt || meta.title}
          fill
          priority
          unoptimized={isCmsAssetUrl(banner.image)}
          className="object-cover"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />
        <div className="tools-hero-inner">
          <p className="tools-hero-text">{banner.text}</p>
        </div>
      </section>
      <ToolsContent
        resources={resources}
        videoHeading={videoData.heading}
        videos={videoData.videos}
      />
    </main>
  );
}
