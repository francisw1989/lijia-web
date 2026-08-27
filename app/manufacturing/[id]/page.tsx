import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleDetail } from '@/components/article-detail';
import {
  allManufacturingProductParams,
  getManufacturingProductDetail,
  isMeaningfulDescription,
  plainTextFromHtml,
} from '@/lib/manufacturing';

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

  return (
    <ArticleDetail
      title={product.title}
      kicker={category?.name || product.category_name || 'Manufacturing'}
      html={product.content}
    >
      <Link href="/manufacturing" className="about-news-more">
        &lt; back to Manufacturing
      </Link>
    </ArticleDetail>
  );
}
