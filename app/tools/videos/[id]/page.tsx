import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { pageMetadata } from '@/lib/site-title';
import { RevealInit } from '@/components/reveal-init';
import { ensureImgAlt, hasRichContent } from '@/lib/capabilities';
import {
  getToolsVideoByParam,
  getToolsVideoParams,
  TOOLS_VIDEOS_HEADING,
} from '@/lib/tools';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getToolsVideoParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getToolsVideoByParam(id);
  if (!data) return pageMetadata({ title: 'Video not found', path: '/tools/videos' });
  return pageMetadata({
    title: data.video.title,
    description: data.video.description || undefined,
    path: `/tools/videos/${data.slug}`,
    image: data.video.poster || undefined,
  });
}

export default async function ToolsVideoDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getToolsVideoByParam(id);
  if (!data) notFound();
  if (id !== data.slug) permanentRedirect(`/tools/videos/${data.slug}`);

  const { video } = data;
  const body = ensureImgAlt(video.content.trim(), video.title);

  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="container tools-doc-page">
        <article className="article-detail cap-tag-page">
          <div className="tools-doc-back">
            <Link href="/tools/videos" className="about-news-more">
              &lt; Back to {TOOLS_VIDEOS_HEADING}
            </Link>
          </div>
          <h1 className="cap-tag-page-title">{video.title}</h1>
          {video.tagName ? (
            <p className="cap-tag-page-category">{video.tagName}</p>
          ) : null}
          <div className="cap-tag-page-media">
            <video
              className="cap-tag-page-video"
              src={video.src}
              poster={video.poster || undefined}
              title={video.title}
              controls
              playsInline
              preload="metadata"
            />
          </div>
          {hasRichContent(body) ? (
            <div
              className="cap-tag-page-body"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : null}
        </article>
      </section>
    </main>
  );
}
