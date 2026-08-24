import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MahjongBreadcrumb } from '@/components/mahjong-nav';
import {
  allMahjongProductParams,
  getMahjongPageData,
  getMahjongProductDetail,
  isMeaningfulDescription,
  plainTextFromHtml,
} from '@/lib/mahjong';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import { isVideoMediaUrl } from '@/lib/media';

type Props = {
  params: Promise<{ tab: string; productId: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return allMahjongProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tab, productId } = await params;
  const data = await getMahjongProductDetail(tab, Number(productId));
  if (!data) return { title: 'Mahjong' };

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;

  return {
    title: data.product.title,
    description,
    keywords: data.product.keywords || undefined,
  };
}

export default async function MahjongProductPage({ params }: Props) {
  const { tab, productId } = await params;
  if (!/^\d+$/.test(productId)) notFound();

  const [data, page] = await Promise.all([
    getMahjongProductDetail(tab, Number(productId)),
    getMahjongPageData(),
  ]);
  if (!data) notFound();

  const { product, category } = data;
  const cover = product.cover?.trim() || '';
  const poster = product.video_cover?.trim() || '';
  const isVideo = isVideoMediaUrl(cover, product.cover_type);
  const intro = isMeaningfulDescription(product.title, product.description)
    ? product.description.trim()
    : '';
  const bodyHtml = product.content?.trim() || '';
  const hasBody = Boolean(plainTextFromHtml(bodyHtml));

  return (
    <section className="cap-tag-page">
      <MahjongBreadcrumb tabs={page.tabs} current={product.title} />
      <h1 className="cap-tag-page-title">{product.title}</h1>
      <p className="cap-tag-page-category">
        {category.name || product.category_name || 'Mahjong'}
      </p>
      {cover ? (
        <div className="cap-tag-page-media">
          {isVideo ? (
            <video
              src={cover}
              poster={poster || undefined}
              controls
              playsInline
              preload="metadata"
              className="cap-tag-page-video"
              aria-label={product.title}
            />
          ) : (
            <Image
              src={cover}
              alt={product.keywords || product.title}
              fill
              priority
              unoptimized={isCmsAssetUrl(cover)}
              className="object-cover"
              sizes="(max-width: 1000px) 100vw, 1000px"
            />
          )}
        </div>
      ) : null}
      {intro ? <p className="cap-tag-page-copy">{intro}</p> : null}
      {hasBody ? (
        <div
          className="cap-tag-page-body"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : null}
    </section>
  );
}
