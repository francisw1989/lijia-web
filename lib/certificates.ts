import { cache } from 'react';
import { getProductCategories, type ProductCategory } from '@/lib/cms';
import { categoryBannerCopy, categoryBannerMedia } from '@/lib/media';

const CERTIFICATES_NAME = 'Certificates';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=2000&q=80';

export type CertificatesPageData = {
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

function findCertificatesCategory(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) => item.parent_id == null && item.name === CERTIFICATES_NAME,
    ) ??
    categories.find(
      (item) => item.parent_id == null && /certificates/i.test(item.name),
    ) ??
    null
  );
}

function fromCategory(category: ProductCategory | null): CertificatesPageData {
  const title = category?.name?.trim() || CERTIFICATES_NAME;
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
      alt: category?.keywords?.trim() || category?.subtitle?.trim() || title,
    },
  };
}

/** Certificates：一级栏目 → metadata / banner */
export const getCertificatesPageData = cache(async (): Promise<CertificatesPageData> => {
  try {
    const categories = await getProductCategories();
    return fromCategory(findCertificatesCategory(categories));
  } catch (error) {
    console.error('[getCertificatesPageData]', error);
    return fromCategory(null);
  }
});
