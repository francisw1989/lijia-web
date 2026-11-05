import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { ArticleDetail } from '@/components/article-detail';
import { JsonLd } from '@/components/json-ld';
import {
  allScopeProductParams,
  getScopeProductByParam,
  isMeaningfulDescription,
  plainTextFromHtml,
  scopeCategoryHref,
} from '@/lib/capabilities';
import { productSchema } from '@/lib/schema';

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
  if (!data) {
    return pageMetadata({ title: 'Capability not found', path: '/capabilities/scope' });
  }

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;

  return pageMetadata({
    title: data.product.title,
    description,
    path: `/capabilities/scope/${data.categorySlug}/${data.productSlug}`,
    image: data.product.cover || undefined,
  });
}

export default async function CapabilityProductPage({ params }: Props) {
  const { categoryId, productId } = await params;
  const data = await getScopeProductByParam(categoryId, productId);
  if (!data) notFound();

  const { product, category, categorySlug, productSlug } = data;
  const canonicalPath = `/capabilities/scope/${categorySlug}/${productSlug}`;

  // 旧数字 URL 或 slug 不一致 → 永久跳到标题路径（利于 Google 换收录）
  if (categoryId !== categorySlug || productId !== productSlug) {
    permanentRedirect(canonicalPath);
  }

  const backHref = scopeCategoryHref(category.id);
  const description =
    (isMeaningfulDescription(product.title, product.description)
      ? product.description
      : plainTextFromHtml(product.content)) || undefined;

  return (
    <>
      <JsonLd
        data={productSchema({
          name: product.title,
          description,
          image: product.cover || undefined,
          url: canonicalPath,
        })}
      />
      <ArticleDetail
        title={product.title}
        kicker={category.name || product.category_name || ''}
        html={product.content}
      >
        <Link href={backHref} className="about-news-more">
          &lt; back to Scope of capabilities
        </Link>
      </ArticleDetail>
    </>
  );
}
