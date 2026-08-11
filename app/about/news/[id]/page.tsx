import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { getAboutSection, getNewsPageData } from '@/lib/about';
import { getProduct } from '@/lib/cms';
import { isCmsAssetUrl } from '@/lib/cms-asset';

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

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
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
      <AboutBanner src={banner.image} poster={banner.poster} alt={banner.alt} />
      <AboutShell>
        <article className="about-news-detail">
          <Link href="/about/news" className="about-news-more">
            &lt; back to News &amp; Events
          </Link>
          <h1 className="about-news-detail-title">{article.title}</h1>
          <p className="about-news-date">{formatDate(article.created_at)}</p>
          {article.cover ? (
            <div className="about-news-detail-cover relative">
              <Image
                src={article.cover}
                alt={article.keywords || article.title}
                fill
                unoptimized={isCmsAssetUrl(article.cover)}
                className="object-cover"
                sizes="(max-width: 900px) 100vw, 720px"
                priority
              />
            </div>
          ) : null}
          <div
            className="about-news-detail-body"
            dangerouslySetInnerHTML={{
              __html: article.content || '<p>No content</p>',
            }}
          />
        </article>
      </AboutShell>
    </>
  );
}
