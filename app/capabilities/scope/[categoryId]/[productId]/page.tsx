import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { ArticleDetail } from '@/components/article-detail';
import {
  allScopeProductParams,
  getScopeProductByParam,
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
  const data = await getScopeProductByParam(categoryId, productId);
  if (!data) return pageMetadata({ title: 'Capability not found' });

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;

  return pageMetadata({
    title: data.product.title,
    description,
  });
}

export default async function CapabilityProductPage({ params }: Props) {
  const { categoryId, productId } = await params;
  const data = await getScopeProductByParam(categoryId, productId);
  if (!data) notFound();

  const { product, category, categorySlug, productSlug } = data;
  const canonicalPath = `/capabilities/scope/${categorySlug}/${productSlug}`;

  // 旧数字 URL 或 slug 不一致 → 跳到标题路径
  if (categoryId !== categorySlug || productId !== productSlug) {
    redirect(canonicalPath);
  }

  const backHref = scopeCategoryHref(category.id);

  return (
    <ArticleDetail
      title={product.title}
      kicker={category.name || product.category_name || ''}
      html={product.content}
    >
      <Link href={backHref} className="about-news-more">
        &lt; back to Scope of capabilities
      </Link>
    </ArticleDetail>
  );
}
