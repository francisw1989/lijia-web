import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { FacilitiesHero } from '@/components/facilities-hero';
import { AboutShell } from '@/components/about-shell';
import { ArticleDetail } from '@/components/article-detail';
import { isVideoMediaUrl } from '@/lib/media';
import {
  getAboutSection,
  getFacilitiesArticleByParam,
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
  const data = await getFacilitiesArticleByParam(id);
  if (!data) return pageMetadata({ title: 'Article not found' });
  return pageMetadata({
    title: data.article.title,
    description: data.article.description || undefined,
    keywords: data.article.keywords || undefined,
  });
}

export default async function FacilitiesArticlePage({ params }: Props) {
  const { id } = await params;
  const [{ banner }, data] = await Promise.all([
    getAboutSection('facilities'),
    getFacilitiesArticleByParam(id),
  ]);

  if (!data) notFound();
  if (id !== data.slug) permanentRedirect(`/about/facilities/${data.slug}`);

  const { article } = data;
  const videoSrc = isVideoMediaUrl(article.cover, article.coverType)
    ? article.cover.trim()
    : '';

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
        <ArticleDetail
          title={article.title}
          html={article.content}
          media={
            videoSrc ? (
              <div className="cap-tag-page-media">
                <video
                  className="cap-tag-page-video"
                  src={videoSrc}
                  poster={article.videoCover || undefined}
                  title={article.title}
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
            ) : null
          }
        >
          <Link href="/about/facilities" className="about-news-more">
            &lt; back to Our Facilities
          </Link>
        </ArticleDetail>
      </AboutShell>
    </>
  );
}
