import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleDetail } from '@/components/article-detail';
import {
  allScopeProductParams,
  getScopeProductDetail,
  isMeaningfulDescription,
  plainTextFromHtml,
  scopeCategoryHref,
} from '@/lib/capabilities';

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
  const backHref = scopeCategoryHref(Number(categoryId));

  return (
    <ArticleDetail
      title={product.title}
      kicker={category?.name || product.category_name || ''}
      html={product.content}
    >
      <Link href={backHref} className="about-news-more">
        &lt; back to Scope of capabilities
      </Link>
    </ArticleDetail>
  );
}
