import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { ArticleDetail } from '@/components/article-detail';
import { JsonLd } from '@/components/json-ld';
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
import { productSchema } from '@/lib/schema';

type Props = {
  params: Promise<{ id: string; productId: string }>;
};

export async function generateStaticParams() {
  return allManufacturingProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug, productId } = await params;
  const data = await getManufacturingProductByParam(slug, productId);
  if (!data) return pageMetadata({ title: 'Not found', path: '/manufacturing' });

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;
  const section = manufacturingSectionSlug(data.category);

  return pageMetadata({
    title: data.product.title,
    description,
    path: `/manufacturing/${section}/${data.productSlug}`,
    image: data.product.cover || undefined,
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
  const description =
    (isMeaningfulDescription(product.title, product.description)
      ? product.description
      : plainTextFromHtml(product.content)) || undefined;

  return (
    <section className="section-pad about-shell">
      <JsonLd
        data={productSchema({
          name: product.title,
          description,
          image: product.cover || undefined,
          url: canonicalPath,
        })}
      />
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
