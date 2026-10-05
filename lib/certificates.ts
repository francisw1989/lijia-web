import { cache } from 'react';
import {
  compareBySortThen,
  getProduct,
  getProductCategories,
  getProducts,
  type Product,
  type ProductCategory,
  type ProductListItem,
} from '@/lib/cms';
import { categoryBannerCopy, categoryBannerMedia } from '@/lib/media';

const CERTIFICATES_NAME = 'Certificates';
const CERT_CHILD = 'certificate';
const PARTNER_CHILD = 'partner';

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
  items: CertificateLogoItem[];
};

export type CertificateLogoItem = {
  id: number;
  title: string;
  image: string;
  href: string;
  group: 'certificate' | 'partner';
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

function childKey(category: ProductCategory) {
  const kw = category.keywords?.trim().toLowerCase();
  if (kw === CERT_CHILD || kw === PARTNER_CHILD) return kw;
  const name = category.name.trim().toLowerCase();
  if (name === CERT_CHILD || name === 'certificates') return CERT_CHILD;
  if (name === PARTNER_CHILD || name === 'partners') return PARTNER_CHILD;
  return '';
}

function findChild(
  categories: ProductCategory[],
  rootId: number,
  key: typeof CERT_CHILD | typeof PARTNER_CHILD,
) {
  return (
    categories.find((item) => item.parent_id === rootId && childKey(item) === key) ??
    null
  );
}

function fromCategory(category: ProductCategory | null): Omit<CertificatesPageData, 'items'> {
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

function mapItems(
  list: ProductListItem[],
  group: CertificateLogoItem['group'],
): CertificateLogoItem[] {
  return list
    .slice()
    .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
    .filter((item) => item.cover?.trim())
    .map((item) => ({
      id: item.id,
      title: item.title,
      image: item.cover.trim(),
      href: `/certificates/${item.id}`,
      group,
    }));
}

/** Certificates：一级栏目 → metadata / banner + 证书/合作伙伴图集 */
export const getCertificatesPageData = cache(async (): Promise<CertificatesPageData> => {
  try {
    const categories = await getProductCategories();
    const root = findCertificatesCategory(categories);
    const page = fromCategory(root);
    if (!root) return { ...page, items: [] };

    const certCat = findChild(categories, root.id, CERT_CHILD);
    const partnerCat = findChild(categories, root.id, PARTNER_CHILD);

    const [certs, partners] = await Promise.all([
      certCat ? getProducts(1, 100, certCat.id) : Promise.resolve({ list: [] }),
      partnerCat ? getProducts(1, 100, partnerCat.id) : Promise.resolve({ list: [] }),
    ]);

    return {
      ...page,
      items: [
        ...mapItems(certs.list, 'certificate'),
        ...mapItems(partners.list, 'partner'),
      ],
    };
  } catch (error) {
    console.error('[getCertificatesPageData]', error);
    return { ...fromCategory(null), items: [] };
  }
});

export async function getCertificateArticle(id: number): Promise<Product | null> {
  if (!Number.isFinite(id) || id <= 0) return null;
  const [article, categories] = await Promise.all([
    getProduct(id),
    getProductCategories(),
  ]);
  if (!article) return null;
  const root = findCertificatesCategory(categories);
  if (!root) return null;
  const childIds = new Set(
    categories.filter((item) => item.parent_id === root.id).map((item) => item.id),
  );
  if (article.category_id !== root.id && !childIds.has(article.category_id || -1)) {
    return null;
  }
  return article;
}

export const getCertificateArticleParams = cache(async () => {
  const { items } = await getCertificatesPageData();
  return items.map((item) => ({ id: String(item.id) }));
});
