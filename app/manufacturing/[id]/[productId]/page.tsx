import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { ArticleDetail } from '@/components/article-detail';
import { ManufacturingCategoryMenu } from '@/components/manufacturing-category-menu';
import { ManufacturingBreadcrumb } from '@/components/manufacturing-nav';
import {
  allManufacturingProductParams,
  getManufacturingMenuItems,
  getManufacturingProductByParam,
  isMeaningfulDescription,
  manufacturingCategoryHref,
  manufacturingSectionSlug,
  plainTextFromHtml,
} from '@/lib/manufacturing';

type Props = {
  params: Promise<{ id: string; productId: string }>;
};

export async function generateStaticParams() {
  return allManufacturingProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug, productId } = await params;
  const data = await getManufacturingProductByParam(slug, productId);
  if (!data) return pageMetadata({ title: 'Not found' });

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;

  return pageMetadata({
    title: data.product.title,
    description,
    keywords: data.product.keywords || undefined,
  });
}

export default async function ManufacturingProductPage({ params }: Props) {
  const { id: slug, productId } = await params;
  const [data, menuItems] = await Promise.all([
    getManufacturingProductByParam(slug, productId),
    getManufacturingMenuItems(),
  ]);
  if (!data?.category) notFound();

  const { product, category, productSlug } = data;
  const canonical = manufacturingSectionSlug(category);
  const canonicalPath = `/manufacturing/${canonical}/${productSlug}`;

  // 旧数字 URL 或栏目 slug 不一致 → 永久跳到标题 slug（利于 Google 换收录）
  if (slug !== canonical || productId !== productSlug) {
    permanentRedirect(canonicalPath);
  }

  const categoryHref = manufacturingCategoryHref(category);

  return (
    <section className="section-pad about-shell">
      <div className="container">
        <ManufacturingCategoryMenu items={menuItems} activeId={canonical} />
        <div className="about-panel">
          <ArticleDetail
            title={product.title}
            kicker={category.name || product.category_name || 'Manufacturing'}
            html={product.content}
          >
            <ManufacturingBreadcrumb
              category={{ label: category.name, href: categoryHref }}
              current={product.title}
            />
          </ArticleDetail>
        </div>
      </div>
    </section>
  );
}
