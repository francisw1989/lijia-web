import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { ArticleDetail } from '@/components/article-detail';
import { getAboutSection, getNewsPageData } from '@/lib/about';
import { getProduct } from '@/lib/cms';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  try {
    const { articles } = await getNewsPageData();
    return articles.map((item) => ({ id: String(item.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getProduct(Number(id));
  if (!article) return { title: 'Article not found' };
  return {
    title: article.title,
    description: article.description || undefined,
    keywords: article.keywords || undefined,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${MONTHS[Number(month) - 1]} ${day}, ${year}`;
}

export default async function AboutNewsDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ banner }, article] = await Promise.all([
    getAboutSection('news'),
    getProduct(Number(id)),
  ]);

  if (!article) notFound();

  return (
    <>
      <AboutBanner src={banner.image} poster={banner.poster} alt={banner.alt} title={banner.title} subtitle={banner.subtitle} />
      <AboutShell>
        <ArticleDetail
          title={article.title}
          kicker={formatDate(article.created_at)}
          html={article.content}
        >
          <Link href="/about/news" className="about-news-more">
            &lt; back to News &amp; Events
          </Link>
        </ArticleDetail>
      </AboutShell>
    </>
  );
}
