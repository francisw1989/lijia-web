import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import {
  getAboutSection,
  getFacilitiesArticle,
  getFacilitiesArticleParams,
} from '@/lib/about';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getFacilitiesArticleParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getFacilitiesArticle(Number(id));
  if (!article) return { title: 'Article not found' };
  return {
    title: article.title,
    description: article.description || undefined,
    keywords: article.keywords || undefined,
  };
}

export default async function FacilitiesArticlePage({ params }: Props) {
  const { id } = await params;
  const [{ banner }, article] = await Promise.all([
    getAboutSection('facilities'),
    getFacilitiesArticle(Number(id)),
  ]);

  if (!article) notFound();

  return (
    <>
      <AboutBanner
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
      />
      <AboutShell>
        <article className="about-news-detail facilities-article" suppressHydrationWarning>
          <Link href="/about/facilities" className="about-news-more">
            &lt; back to Our Facilities
          </Link>
          <h1 className="about-news-detail-title">{article.title}</h1>
          {article.cover ? (
            <div className="about-news-detail-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover}
                alt={article.keywords || article.title}
                className="about-news-detail-cover-img"
              />
            </div>
          ) : null}
          <div
            className="about-news-detail-body"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: article.content || '<p>No content</p>',
            }}
          />
        </article>
      </AboutShell>
    </>
  );
}
