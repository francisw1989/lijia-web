import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { ArticleDetail } from '@/components/article-detail';
import { ArticleEngagement } from '@/components/article-engagement';
import { JsonLd } from '@/components/json-ld';
import {
  getAboutSection,
  getEventByParam,
  getEventParams,
} from '@/lib/about';
import { getProduct } from '@/lib/cms';
import { articleSchema } from '@/lib/schema';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getEventParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resolved = await getEventByParam(id);
  if (!resolved) return pageMetadata({ title: 'Article not found', path: '/events' });
  const article = await getProduct(resolved.productId);
  if (!article) return pageMetadata({ title: 'Article not found', path: '/events' });
  return pageMetadata({
    title: article.title,
    description: article.description || undefined,
    path: `/events/${resolved.slug}`,
    image: article.cover || undefined,
    type: 'article',
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
  const path = `/events/${resolved.slug}`;

  return (
    <>
      <JsonLd
        data={articleSchema({
          headline: article.title,
          description: article.description,
          image: article.cover,
          url: path,
          datePublished: article.created_at,
          dateModified: article.updated_at || article.created_at,
        })}
      />
      <AboutBanner
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
      />
      <section className="section-pad">
        <div className="container">
          <div className="event-article">
            <ArticleDetail
              title={article.title}
              kicker={formatDate(article.created_at)}
              html={article.content}
            >
              <Link href="/events" className="about-news-more">
                &lt; back to Events
              </Link>
            </ArticleDetail>
            <ArticleEngagement
              articleId={article.id}
              target="product"
              initialComments={article.comments || []}
              initialLikeCount={article.like_count || 0}
              initialCommentCount={article.comment_count || 0}
              initialViewCount={article.view_count || 0}
            />
          </div>
        </div>
      </section>
    </>
  );
}
