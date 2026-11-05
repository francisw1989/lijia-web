import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { pageMetadata } from '@/lib/site-title';
import { RevealInit } from '@/components/reveal-init';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { ArticleDetail } from '@/components/article-detail';
import { JsonLd } from '@/components/json-ld';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import {
  getCertificateArticleParams,
  getCertificateByParam,
  getCertificatesPageData,
} from '@/lib/certificates';
import { articleSchema } from '@/lib/schema';

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return getCertificateArticleParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getCertificateByParam(id);
  if (!data) return pageMetadata({ title: 'Not found', path: '/certificates' });
  return pageMetadata({
    title: data.article.title,
    description: data.article.description || undefined,
    path: `/certificates/${data.slug}`,
    image: data.article.cover || undefined,
    type: 'article',
  });
}

export default async function CertificateArticlePage({ params }: Props) {
  const { id } = await params;
  const [{ meta, banner }, data] = await Promise.all([
    getCertificatesPageData(),
    getCertificateByParam(id),
  ]);

  if (!data) notFound();
  if (id !== data.slug) permanentRedirect(`/certificates/${data.slug}`);

  const { article, slug } = data;
  const path = `/certificates/${slug}`;

  return (
    <main className="bg-white min-h-page">
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
      <RevealInit />
      <section className="reveal about-hero container">
        <HeroMedia
          src={banner.image}
          poster={banner.poster}
          alt={banner.alt || meta.title}
          priority
          mask={true}
        />
        <HeroBannerCopy title={banner.title} subtitle={banner.subtitle} />
      </section>
      <div className="container">
        <ArticleDetail
          title={article.title}
          kicker={article.category_name || undefined}
          html={article.content}
          media={
            article.cover ? (
              <div className="cap-tag-page-media certificates-detail-media">
                <Image
                  src={article.cover}
                  alt={article.title}
                  fill
                  unoptimized={isCmsAssetUrl(article.cover)}
                  className="object-contain"
                  sizes="(max-width: 900px) 100vw, 720px"
                />
              </div>
            ) : null
          }
        >
          <Link href="/certificates" className="about-news-more">
            &lt; back to Certificates
          </Link>
        </ArticleDetail>
      </div>
    </main>
  );
}
