import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { GalleryLink } from '@/components/gallery-img-hover';
import { ManufacturingBreadcrumb, ManufacturingNav } from '@/components/manufacturing-nav';
import { PagePager } from '@/components/page-pager';
import {
  allManufacturingCategoryParams,
  getManufacturingCategoryPage,
  getManufacturingNavItems,
  isMahjongCategory,
  manufacturingSectionSlug,
  paginateItems,
  resolveManufacturingNumericRedirect,
} from '@/lib/manufacturing';
import { MAHJONG_HOME } from '@/lib/mahjong';

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
  if (!data) return { title: 'Not found' };

  return {
    title: data.category.name,
    description: data.category.description?.trim() || undefined,
    keywords: data.category.keywords?.trim() || undefined,
  };
}

export default async function ManufacturingCategoryPage({
  params,
  searchParams,
}: Props) {
  const { id: slug } = await params;

  if (/^\d+$/.test(slug)) {
    const target = await resolveManufacturingNumericRedirect(Number(slug));
    if (target) redirect(target);
    notFound();
  }

  const [data, navItems] = await Promise.all([
    getManufacturingCategoryPage(slug),
    getManufacturingNavItems(),
  ]);
  if (!data) notFound();

  if (isMahjongCategory(data.category)) {
    redirect(MAHJONG_HOME);
  }

  const canonical = manufacturingSectionSlug(data.category);
  const { page: pageParam } = await searchParams;
  const pageNum = Number(pageParam) || 1;
  if (slug !== canonical) {
    redirect(
      pageNum > 1
        ? `/manufacturing/${canonical}?page=${pageNum}`
        : `/manufacturing/${canonical}`,
    );
  }

  const { items, page, pageCount } = paginateItems(data.articles, pageNum);

  return (
    <section className="section-pad about-shell">
      <div className="container about-layout">
        <ManufacturingNav items={navItems} />
        <div className="about-panel">
          <ManufacturingBreadcrumb
            category={{
              label: data.category.name,
              href: `/manufacturing/${canonical}`,
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
            hrefFor={(n) =>
              n <= 1
                ? `/manufacturing/${canonical}`
                : `/manufacturing/${canonical}?page=${n}`
            }
          />
        </div>
      </div>
    </section>
  );
}
