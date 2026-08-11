import { getProductCategories, type ProductCategory } from '@/lib/cms';
import { categoryBannerCopy, categoryBannerMedia } from '@/lib/media';

export const PROJECT_SERVICE_LINKS = [
  { label: 'Our video', href: '/tools/videos' },
  { label: 'Our Templates', href: '/tools#templates' },
  { label: 'Safety Standard', href: '/tools/safety' },
  { label: 'Terms of sale', href: '/tools/terms' },
  { label: 'FAQ', href: '/tools/faq' },
] as const;

const PROJECT_NAME = 'Start A Project';
const FALLBACK_BANNER = '/images/banner/1.jpg';

export type ProjectPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  banner: {
    image: string;
    poster?: string;
    alt: string;
    title?: string;
    subtitle?: string;
  };
};

function findProjectCategory(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) =>
        item.parent_id == null &&
        /^start\s*a\s*project$/i.test(item.name.trim()),
    ) ??
    categories.find(
      (item) =>
        item.parent_id == null && /start.*project|project/i.test(item.name),
    ) ??
    null
  );
}

function fromCategory(category: ProductCategory | null): ProjectPageData {
  const title = category?.name?.trim() || PROJECT_NAME;
  return {
    meta: {
      title,
      description: category?.description?.trim() || undefined,
      keywords: category?.keywords?.trim() || undefined,
    },
    banner: {
      image: categoryBannerMedia(category).image || FALLBACK_BANNER,
      poster: categoryBannerMedia(category).poster,
      ...categoryBannerCopy(category),
      alt: category?.subtitle?.trim() || title,
    },
  };
}

/** Start A Project：一级栏目 → metadata / banner */
export async function getProjectPageData(): Promise<ProjectPageData> {
  try {
    const categories = await getProductCategories();
    return fromCategory(findProjectCategory(categories));
  } catch (error) {
    console.error('[getProjectPageData]', error);
    return fromCategory(null);
  }
}

/** @deprecated 使用 getProjectPageData().banner */
export const PROJECT_HERO = FALLBACK_BANNER;
