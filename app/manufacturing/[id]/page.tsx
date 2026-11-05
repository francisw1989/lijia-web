import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { GalleryLink } from '@/components/gallery-img-hover';
import { ManufacturingCategoryMenu } from '@/components/manufacturing-category-menu';
import { ManufacturingBreadcrumb } from '@/components/manufacturing-nav';
import { PagePager } from '@/components/page-pager';
import {
  allManufacturingCategoryParams,
  getManufacturingCategoryPage,
  getManufacturingMenuItems,
  manufacturingCategoryListHref,
  manufacturingSectionSlug,
  paginateItems,
  resolveManufacturingNumericRedirect,
} from '@/lib/manufacturing';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  return allManufacturingCategoryParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug } = await params;
  const data = await getManufacturingCategoryPage(slug);
  if (!data) return pageMetadata({ title: 'Not found', path: '/manufacturing' });
  const canonical = manufacturingSectionSlug(data.category);

  return pageMetadata({
    title: data.category.name,
    description: data.category.description?.trim() || undefined,
    path: `/manufacturing/${canonical}`,
    image: data.category.image || undefined,
  });
}

export default async function ManufacturingCategoryPage({
  params,
  searchParams,
}: Props) {
  const { id: slug } = await params;

  if (/^\d+$/.test(slug)) {
    const target = await resolveManufacturingNumericRedirect(Number(slug));
    if (target) permanentRedirect(target);
    notFound();
  }

  const [data, menuItems] = await Promise.all([
    getManufacturingCategoryPage(slug),
    getManufacturingMenuItems(),
  ]);
  if (!data) notFound();

  const canonical = manufacturingSectionSlug(data.category);
  const { page: pageParam } = await searchParams;
  const pageNum = Number(pageParam) || 1;

  // 旧 ?page=N → 静态 /page/N（与博客一致）
  if (pageNum > 1) {
    permanentRedirect(manufacturingCategoryListHref(canonical, pageNum));
  }

  if (slug !== canonical) {
    permanentRedirect(manufacturingCategoryListHref(canonical, 1));
  }

  const { items, page, pageCount } = paginateItems(data.articles, 1);

  return (
    <section className="section-pad about-shell">
      <div className="container">
        <ManufacturingCategoryMenu items={menuItems} activeId={canonical} />
        <div className="about-panel">
          <ManufacturingBreadcrumb
            category={{
              label: data.category.name,
              href: manufacturingCategoryListHref(canonical, 1),
            }}
          />
          <h1 className="about-news-detail-title">{data.category.name}</h1>
          {items.length ? (
            <div className="facilities-gallery-grid">
              {items.map((item) => (
                <GalleryLink
                  key={item.id}
                  href={item.href}
                  src={item.image || item.icon}
                  alt={item.title}
                  className="facilities-gallery-item mfg-gallery-item"
                />
              ))}
            </div>
          ) : (
            <p className="about-news-desc">No articles yet.</p>
          )}
          <PagePager
            page={page}
            pageCount={pageCount}
            hrefFor={(n) => manufacturingCategoryListHref(canonical, n)}
          />
        </div>
      </div>
    </section>
  );
}
