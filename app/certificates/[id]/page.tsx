import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/site-title';
import { RevealInit } from '@/components/reveal-init';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { ArticleDetail } from '@/components/article-detail';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import {
  getCertificateArticle,
  getCertificateArticleParams,
  getCertificatesPageData,
} from '@/lib/certificates';

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return getCertificateArticleParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getCertificateArticle(Number(id));
  if (!article) return pageMetadata({ title: 'Not found' });
  return pageMetadata({
    title: article.title,
    description: article.description || undefined,
    keywords: article.keywords || undefined,
  });
}

export default async function CertificateArticlePage({ params }: Props) {
  const { id } = await params;
  const [{ meta, banner }, article] = await Promise.all([
    getCertificatesPageData(),
    getCertificateArticle(Number(id)),
  ]);

  if (!article) notFound();

  return (
    <main className="bg-white min-h-page">
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
