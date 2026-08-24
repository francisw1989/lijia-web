import type { Metadata } from 'next';
import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import { ToolsVideosContent } from '@/components/tools-videos-content';
import { getToolsVideos, TOOLS_VIDEOS_HEADING } from '@/lib/tools';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { heading } = await getToolsVideos();
  return {
    title: heading || TOOLS_VIDEOS_HEADING,
    description:
      'Watch manufacturing tips, component highlights and production videos from LIJIA.',
  };
}

export default async function ToolsVideosPage() {
  const { heading, tags, videos } = await getToolsVideos();

  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="container tools-doc-page">
        <div className="tools-doc-back">
          <Link href="/tools" className="about-news-more">
            &lt; Back to Tools &amp; Resources
          </Link>
        </div>
        <h1 className="tools-doc-heading" style={{ marginBottom: 28 }}>
          {heading || TOOLS_VIDEOS_HEADING}
        </h1>
        {videos.length ? (
          <ToolsVideosContent tags={tags} videos={videos} />
        ) : (
          <p className="tools-doc-empty">Videos will be available soon.</p>
        )}
      </section>
    </main>
  );
}
