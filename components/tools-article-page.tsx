import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import { ArticleDetail } from '@/components/article-detail';
import type { ToolsArticlePageData } from '@/lib/tools';

export function renderToolsArticleContent(data: ToolsArticlePageData) {
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="container tools-doc-page">
        <ArticleDetail title={data.title} html={data.content}>
          <div className="tools-doc-back">
            <Link href="/tools" className="about-news-more">
              &lt; Back to Tools &amp; Resources
            </Link>
          </div>
        </ArticleDetail>
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
