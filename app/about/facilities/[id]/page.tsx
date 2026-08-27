import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FacilitiesHero } from '@/components/facilities-hero';
import { AboutShell } from '@/components/about-shell';
import { ArticleDetail } from '@/components/article-detail';
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
      <FacilitiesHero
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
      />
      <AboutShell>
        <ArticleDetail title={article.title} html={article.content}>
          <Link href="/about/facilities" className="about-news-more">
            &lt; back to Our Facilities
          </Link>
        </ArticleDetail>
      </AboutShell>
    </>
  );
}
