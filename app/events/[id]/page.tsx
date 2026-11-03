import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { ArticleDetail } from '@/components/article-detail';
import {
  getAboutSection,
  getEventByParam,
  getEventParams,
} from '@/lib/about';
import { getProduct } from '@/lib/cms';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getEventParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resolved = await getEventByParam(id);
  if (!resolved) return pageMetadata({ title: 'Article not found' });
  const article = await getProduct(resolved.productId);
  if (!article) return pageMetadata({ title: 'Article not found' });
  return pageMetadata({
    title: article.title,
    description: article.description || undefined,
    keywords: article.keywords || undefined,
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${MONTHS[Number(month) - 1]} ${day}, ${year}`;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const resolved = await getEventByParam(id);
  if (!resolved) notFound();
  if (id !== resolved.slug) permanentRedirect(`/events/${resolved.slug}`);

  const [{ banner }, article] = await Promise.all([
    getAboutSection('news'),
    getProduct(resolved.productId),
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
      <section className="section-pad">
        <div className="container">
          <ArticleDetail
            title={article.title}
            kicker={formatDate(article.created_at)}
            html={article.content}
          >
            <Link href="/events" className="about-news-more">
              &lt; back to Events
            </Link>
          </ArticleDetail>
        </div>
      </section>
    </>
  );
}
