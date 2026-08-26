import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  allManufacturingProductParams,
  getManufacturingProductDetail,
  hasRichContent,
  isMeaningfulDescription,
  plainTextFromHtml,
} from '@/lib/manufacturing';
import { isCmsAssetUrl } from '@/lib/cms-asset';

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return allManufacturingProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return { title: 'Not found' };

  const data = await getManufacturingProductDetail(Number(id));
  if (!data) return { title: 'Not found' };

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

export default async function ManufacturingDetailPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const data = await getManufacturingProductDetail(Number(id));
  if (!data) notFound();

  const { product, category } = data;
  const cover = product.cover?.trim() || '';
  const intro = isMeaningfulDescription(product.title, product.description)
    ? product.description.trim()
    : '';
  const bodyHtml = product.content?.trim() || '';
  const hasBody = hasRichContent(bodyHtml);

  return (
    <section className="cap-tag-page">
      <Link href="/manufacturing" className="about-news-more">
        &lt; back to Manufacturing
      </Link>
      <h1 className="cap-tag-page-title">{product.title}</h1>
      <p className="cap-tag-page-category">
        {category?.name || product.category_name || 'Manufacturing'}
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
