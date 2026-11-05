import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { GalleryLink } from '@/components/gallery-img-hover';
import { ManufacturingCategoryMenu } from '@/components/manufacturing-category-menu';
import { ManufacturingBreadcrumb } from '@/components/manufacturing-nav';
import { PagePager } from '@/components/page-pager';
import {
  allManufacturingCategoryPageParams,
  getManufacturingCategoryPage,
  getManufacturingMenuItems,
  manufacturingCategoryListHref,
  manufacturingSectionSlug,
  paginateItems,
} from '@/lib/manufacturing';

type Props = {
  params: Promise<{ id: string; page: string }>;
};

export async function generateStaticParams() {
  return allManufacturingCategoryPageParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slug, page } = await params;
  const pageNum = Number(page);
  const data = await getManufacturingCategoryPage(slug);
  if (!data || !Number.isInteger(pageNum) || pageNum < 1) {
    return pageMetadata({ title: 'Not found', path: '/manufacturing' });
  }
  const canonical = manufacturingSectionSlug(data.category);
  const title =
    pageNum > 1
      ? `${data.category.name} · Page ${pageNum}`
      : data.category.name;

  return pageMetadata({
    title,
    description: data.category.description?.trim() || undefined,
    path: manufacturingCategoryListHref(canonical, pageNum),
    image: data.category.image || undefined,
  });
}

export default async function ManufacturingCategoryPagedPage({ params }: Props) {
  const { id: slug, page: pageParam } = await params;
  const pageNum = Number(pageParam);
  if (!Number.isInteger(pageNum) || pageNum < 1) notFound();

  const [data, menuItems] = await Promise.all([
    getManufacturingCategoryPage(slug),
    getManufacturingMenuItems(),
  ]);
  if (!data) notFound();

  const canonical = manufacturingSectionSlug(data.category);
  if (pageNum === 1) {
    permanentRedirect(manufacturingCategoryListHref(canonical, 1));
  }
  if (slug !== canonical) {
    permanentRedirect(manufacturingCategoryListHref(canonical, pageNum));
  }

  const { items, page, pageCount } = paginateItems(data.articles, pageNum);
  if (pageNum > pageCount) notFound();

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
