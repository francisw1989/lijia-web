import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  allScopeProductParams,
  getScopeProductDetail,
  hasRichContent,
  isMeaningfulDescription,
  plainTextFromHtml,
  scopeCategoryHref,
} from '@/lib/capabilities';
import { isCmsAssetUrl } from '@/lib/cms-asset';

type Props = {
  params: Promise<{ categoryId: string; productId: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return allScopeProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId, productId } = await params;
  const data = await getScopeProductDetail(Number(categoryId), Number(productId));
  if (!data) return { title: 'Capability not found' };

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;

  return {
    title: data.product.title,
    description,
  };
}

export default async function CapabilityProductPage({ params }: Props) {
  const { categoryId, productId } = await params;
  const data = await getScopeProductDetail(Number(categoryId), Number(productId));
  if (!data) notFound();

  const { product, category } = data;
  const cover = product.cover?.trim() || '';
  const intro = isMeaningfulDescription(product.title, product.description)
    ? product.description.trim()
    : '';
  const bodyHtml = product.content?.trim() || '';
  const hasBody = hasRichContent(bodyHtml);
  const backHref = scopeCategoryHref(Number(categoryId));

  return (
    <section className="cap-tag-page">
      <Link href={backHref} className="about-news-more">
        &lt; back to Scope of capabilities
      </Link>
      <h1 className="cap-tag-page-title">{product.title}</h1>
      <p className="cap-tag-page-category">
        {category?.name || product.category_name || ''}
      </p>
      {cover ? (
        <div className="cap-tag-page-media">
          <Image
            src={cover}
            alt={product.keywords || product.title}
            fill
            priority
            unoptimized={isCmsAssetUrl(cover)}
            className="object-cover"
            sizes="(max-width: 1000px) 100vw, 1000px"
          />
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
