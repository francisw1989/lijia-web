import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import type { ToolsArticlePageData } from '@/lib/tools';

export function renderToolsArticleContent(data: ToolsArticlePageData) {
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="container tools-doc-page">
        <div className="tools-doc-back">
          <Link href="/tools" className="about-news-more">
            &lt; Back to Tools &amp; Resources
          </Link>
        </div>
        <article className="tools-article-detail" suppressHydrationWarning>
          <h1 className="tools-doc-heading">{data.title}</h1>
          {data.cover ? (
            <div className="about-news-detail-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.cover}
                alt={data.meta.keywords || data.title}
                className="about-news-detail-cover-img"
              />
            </div>
          ) : null}
          <div
            className="about-news-detail-body tools-article-body"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: data.content || '<p>No content</p>',
            }}
          />
        </article>
      </section>
    </main>
  );
}

export function toolsArticleMetadataFromData(data: ToolsArticlePageData | null) {
  if (!data) return { title: 'Tools & Resources' };
  return {
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
  };
}
