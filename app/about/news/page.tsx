import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { getAboutSection, getNewsPageData, type NewsItem } from '@/lib/about';
import { isCmsAssetUrl } from '@/lib/cms-asset';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutSection('news');
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
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

function newsHref(id: number) {
  return `/about/news/${id}`;
}

function NewsCard({ item }: { item: NewsItem }) {
  const href = newsHref(item.id);
  return (
    <article className="about-news-card">
      {item.cover ? (
        <Link href={href} className="about-news-card-media relative">
          <Image
            src={item.cover}
            alt={item.keywords || item.title}
            fill
            unoptimized={isCmsAssetUrl(item.cover)}
            className="object-cover"
            sizes="(max-width: 800px) 100vw, 28vw"
          />
        </Link>
      ) : null}
      <div className="about-news-card-body">
        <time className="about-news-date" dateTime={item.created_at}>
          {formatDate(item.created_at)}
        </time>
        <h3 className="about-news-title">
          <Link href={href}>{item.title}</Link>
        </h3>
        {item.description ? (
          <p className="about-news-desc">{item.description}</p>
        ) : null}
        <Link href={href} className="about-news-more">
          learn more &gt;
        </Link>
      </div>
    </article>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const href = newsHref(item.id);
  return (
    <article className="about-news-row">
      {item.cover ? (
        <Link href={href} className="about-news-row-media relative">
          <Image
            src={item.cover}
            alt={item.keywords || item.title}
            fill
            unoptimized={isCmsAssetUrl(item.cover)}
            className="object-cover"
            sizes="(max-width: 800px) 40vw, 220px"
          />
        </Link>
      ) : null}
      <div className="about-news-row-body">
        <time className="about-news-date" dateTime={item.created_at}>
          {formatDate(item.created_at)}
        </time>
        <h3 className="about-news-title">
          <Link href={href}>{item.title}</Link>
        </h3>
        {item.description ? (
          <p className="about-news-desc">{item.description}</p>
        ) : null}
      </div>
    </article>
  );
}

export default async function AboutNewsPage() {
  const [{ banner }, { featured, articles }] = await Promise.all([
    getAboutSection('news'),
    getNewsPageData(),
  ]);

  return (
    <>
      <AboutBanner src={banner.image} alt={banner.alt} />
      <AboutShell>
        <div className="about-news-page">
          {featured.length ? (
            <div className="about-news-featured">
              {featured.map((item) => (
                <NewsCard key={`featured-${item.id}`} item={item} />
              ))}
            </div>
          ) : null}

          <h2 className="about-news-all-heading">all article</h2>

          {articles.length ? (
            <div className="about-news-list">
              {articles.map((item) => (
                <NewsRow key={`list-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <p className="about-news-desc">No articles yet.</p>
          )}
        </div>
      </AboutShell>
    </>
  );
}
