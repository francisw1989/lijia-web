import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleDetail } from '@/components/article-detail';
import { ManufacturingBreadcrumb, ManufacturingNav } from '@/components/manufacturing-nav';
import {
  allManufacturingProductParams,
  getManufacturingNavItems,
  getManufacturingProductDetail,
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
  const { productId } = await params;
  if (!/^\d+$/.test(productId)) return { title: 'Not found' };

  const data = await getManufacturingProductDetail(Number(productId));
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

export default async function ManufacturingProductPage({ params }: Props) {
  const { id: slug, productId } = await params;
  if (!/^\d+$/.test(productId)) notFound();

  const [data, navItems] = await Promise.all([
    getManufacturingProductDetail(Number(productId)),
    getManufacturingNavItems(),
  ]);
  if (!data?.category) notFound();

  const { product, category } = data;
  const canonical = manufacturingSectionSlug(category);
  if (slug !== canonical) {
    redirect(`/manufacturing/${canonical}/${product.id}`);
  }

  const categoryHref = manufacturingCategoryHref(category);

  return (
    <section className="section-pad about-shell">
      <div className="container about-layout">
        <ManufacturingNav items={navItems} />
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
