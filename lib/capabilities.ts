import {
  getAlbums,
  getProduct,
  getProductCategories,
  getProducts,
  compareBySortThen,
  type Product,
  type ProductCategory,
  type ProductListItem,
} from '@/lib/cms';
import { categoryBannerMedia } from '@/lib/media';

export const CAPABILITIES_NAV = [
  { href: '/capabilities/scope', label: 'Scope of capabilities' },
  { href: '/capabilities/quality', label: 'Quality Control' },
] as const;

export type ScopeTag = {
  id: number;
  title: string;
  description: string;
  cover: string;
};

export type ScopeItem = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  image: string;
  tags: ScopeTag[];
};

export type ScopePageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  hero: {
    image: string;
    poster?: string;
    title: string;
    subtitle: string;
  };
  items: ScopeItem[];
};

const SCOPE_ROOT_NAME = 'Scope of capabilities';

const SCOPE_ICONS = [
  '/images/sc/1.png',
  '/images/sc/2.png',
  '/images/sc/3.png',
  '/images/sc/4.png',
  '/images/sc/5.png',
  '/images/sc/6.png',
  '/images/sc/7.png',
] as const;

const DEFAULT_SCOPE_IMAGE =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80';

export const CAP_HERO = {
  scope: {
    title: 'Scientific innovation keeps pace with the times',
    subtitle:
      'End-to-end manufacturing capabilities for plastic, printing, assembly and quality control — built for board games and consumer products.',
  },
  quality: {
    title: 'Worried about quality issues?',
    subtitle:
      'Our professional QA/QC team ensures end-to-end traceability: every detail measured, every step recorded. From raw materials to finished products, we deliver verifiable certainty, so you can trust every shipment.',
  },
} as const;

const QUALITY_ROOT_NAME = 'Quality Control';

export type QualityPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  hero: {
    image: string;
    poster?: string;
    title: string;
    subtitle: string;
  };
};

function findQualityRoot(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) => item.parent_id == null && item.name === QUALITY_ROOT_NAME,
    ) ??
    categories.find(
      (item) =>
        item.parent_id == null && /quality\s*control/i.test(item.name),
    ) ??
    null
  );
}

/** 栏目文案若为空或仍是栏目名，则回退到默认 banner 文案 */
function capHeroText(
  value: string | undefined,
  fallback: string,
  categoryName: string,
) {
  const text = value?.trim() || '';
  if (!text || text === categoryName) return fallback;
  return text;
}

function capHeroFromCategory(
  category: ProductCategory | null,
  fallbackName: string,
  fallback: { title: string; subtitle: string },
) {
  const name = category?.name?.trim() || fallbackName;
  const media = categoryBannerMedia(category);
  return {
    image: media.image || category?.thumbnail?.trim() || '',
    poster: media.poster,
    title: capHeroText(
      category?.keywords || category?.subtitle,
      fallback.title,
      name,
    ),
    subtitle: capHeroText(category?.description, fallback.subtitle, name),
  };
}

function qualityFromCategory(category: ProductCategory | null): QualityPageData {
  const name = category?.name?.trim() || QUALITY_ROOT_NAME;
  return {
    meta: {
      title: name,
      description: category?.description?.trim() || undefined,
      keywords: category?.keywords?.trim() || undefined,
    },
    hero: capHeroFromCategory(category, QUALITY_ROOT_NAME, CAP_HERO.quality),
  };
}

/** Quality Control：一级栏目 → metadata / banner */
export async function getQualityPageData(): Promise<QualityPageData> {
  try {
    const categories = await getProductCategories();
    return qualityFromCategory(findQualityRoot(categories));
  } catch (error) {
    console.error('[getQualityPageData]', error);
    return qualityFromCategory(null);
  }
}

function findScopeRoot(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) => item.parent_id == null && item.name === SCOPE_ROOT_NAME,
    ) ??
    categories.find(
      (item) =>
        item.parent_id == null &&
        /scope\s+of\s+capabilities/i.test(item.name),
    ) ??
    null
  );
}

function mapProductsByCategory(products: ProductListItem[]) {
  const map = new Map<number, ProductListItem[]>();
  for (const product of products) {
    if (product.category_id == null) continue;
    const list = map.get(product.category_id) ?? [];
    list.push(product);
    map.set(product.category_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id));
  }
  return map;
}

export function scopeTagHref(categoryId: number, productId: number) {
  return `/capabilities/scope/${categoryId}/${productId}`;
}

export function scopeCategoryHref(categoryId: number) {
  return `/capabilities/scope#${categoryId}`;
}

export type HomeCapabilityPanel = {
  id: number;
  title: string;
  desc: string;
  image: string;
  href: string;
};

const HOME_CAPA_FALLBACK: HomeCapabilityPanel[] = [
  {
    id: 1,
    title: 'Capabilities 01',
    desc: 'Detailed introduction of Capability 01, Detailed introduction of Capability 01.',
    image:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80',
    href: '/capabilities/scope',
  },
  {
    id: 2,
    title: 'Capabilities 02',
    desc: 'Detailed introduction of Capability 02, electronics and smart module assembly.',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    href: '/capabilities/scope',
  },
  {
    id: 3,
    title: 'Capabilities 03',
    desc: 'Detailed introduction of Capability 03, automated finishing at production scale.',
    image:
      'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80',
    href: '/capabilities/scope',
  },
];

/** 首页 Capabilities：Scope of capabilities 下标记推荐的二级栏目 */
export async function getHomeCapabilityPanels(
  limit = 3,
): Promise<HomeCapabilityPanel[]> {
  try {
    const categories = await getProductCategories();
    const root = findScopeRoot(categories);
    if (!root) return HOME_CAPA_FALLBACK;

    const recommended = categories
      .filter(
        (item) =>
          item.parent_id === root.id && Number(item.is_recommended) === 1,
      )
      .sort((a, b) => a.sort - b.sort || a.id - b.id)
      .slice(0, limit);

    if (!recommended.length) return HOME_CAPA_FALLBACK;

    return recommended.map((category, index) => ({
      id: category.id,
      title:
        category.name ||
        `Capabilities ${String(index + 1).padStart(2, '0')}`,
      desc: category.subtitle || category.description || '',
      image: category.image || HOME_CAPA_FALLBACK[index % HOME_CAPA_FALLBACK.length].image,
      href: scopeCategoryHref(category.id),
    }));
  } catch (error) {
    console.error('[getHomeCapabilityPanels]', error);
    return HOME_CAPA_FALLBACK;
  }
}

function scopeMetaFromRoot(root: ProductCategory | null): ScopePageData['meta'] {
  if (!root) {
    return { title: SCOPE_ROOT_NAME };
  }
  return {
    title: root.name || SCOPE_ROOT_NAME,
    description: root.description?.trim() || undefined,
    keywords: root.keywords?.trim() || undefined,
  };
}

export async function getScopePageData(): Promise<ScopePageData> {
  try {
    const categories = await getProductCategories();
    const root = findScopeRoot(categories);
    if (!root) {
      return {
        meta: scopeMetaFromRoot(null),
        hero: capHeroFromCategory(null, SCOPE_ROOT_NAME, CAP_HERO.scope),
        items: [],
      };
    }

    const children = categories
      .filter((item) => item.parent_id === root.id)
      .sort((a, b) => a.sort - b.sort || a.id - b.id);

    const { list: products } = await getProducts(1, 100, root.id);
    const productsByCategory = mapProductsByCategory(products);

    const items: ScopeItem[] = children.map((category, index) => ({
      id: category.id,
      title: category.name,
      subtitle: category.subtitle || category.description || '',
      icon:
        category.thumbnail ||
        category.image ||
        SCOPE_ICONS[index % SCOPE_ICONS.length],
      image: category.image || DEFAULT_SCOPE_IMAGE,
      tags: (productsByCategory.get(category.id) ?? []).map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description || '',
        cover: product.cover || '',
      })),
    }));

    return {
      meta: scopeMetaFromRoot(root),
      hero: capHeroFromCategory(root, SCOPE_ROOT_NAME, CAP_HERO.scope),
      items,
    };
  } catch (error) {
    console.error('[getScopePageData]', error);
    return {
      meta: scopeMetaFromRoot(null),
      hero: capHeroFromCategory(null, SCOPE_ROOT_NAME, CAP_HERO.scope),
      items: [],
    };
  }
}

export async function getScopeProductDetail(
  categoryId: number,
  productId: number,
): Promise<{
  product: Product;
  category: ProductCategory | null;
  image: string;
} | null> {
  try {
    const product = await getProduct(productId);
    if (!product || product.category_id !== categoryId) return null;

    const categories = await getProductCategories();
    const category = categories.find((item) => item.id === categoryId) ?? null;
    const image =
      product.cover || category?.image || DEFAULT_SCOPE_IMAGE;

    return { product, category, image };
  } catch (error) {
    console.error('[getScopeProductDetail]', error);
    return null;
  }
}

export async function allScopeProductParams() {
  try {
    const categories = await getProductCategories();
    const root = findScopeRoot(categories);
    if (!root) return [];

    const children = new Set(
      categories.filter((item) => item.parent_id === root.id).map((item) => item.id),
    );
    const { list } = await getProducts(1, 100, root.id);

    return list
      .filter(
        (item) =>
          item.category_id != null && children.has(item.category_id),
      )
      .map((item) => ({
        categoryId: String(item.category_id),
        productId: String(item.id),
      }));
  } catch {
    return [];
  }
}

export function plainTextFromHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isMeaningfulDescription(title: string, description: string) {
  const text = description.trim();
  if (!text) return false;
  return text.toLowerCase() !== title.trim().toLowerCase();
}

export const QC_PHASES = [
  {
    id: 'iqc',
    label: 'IQC: Incoming Quality Control',
    icon: '/images/qc1.png',
  },
  {
    id: 'ipqc',
    label: 'IPQC: In Process Quality Control',
    icon: '/images/qc2.png',
  },
  {
    id: 'fqc',
    label: 'FQC: Final Quality Control',
    icon: '/images/qc3.png',
  },
  {
    id: 'oqc',
    label: 'OQC: Outgoing Quality Control',
    icon: '/images/qc4.png',
  },
];

export const QC_GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    alt: 'Automated production inspection',
  },
  {
    src: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
    alt: 'Precision lab measurement',
  },
  {
    src: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1200&q=80',
    alt: 'Quality testing workstation',
  },
  {
    src: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1200&q=80',
    alt: 'Manufacturing quality line',
  },
  {
    src: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    alt: 'Factory floor quality control',
  },
];

export type QualityGalleryImage = {
  src: string;
  alt: string;
};

/** Quality Control 图集 → 跑马灯画廊 */
export async function getQualityGallery(): Promise<QualityGalleryImage[]> {
  try {
    const albums = await getAlbums([QUALITY_ROOT_NAME]);
    const album =
      albums.find(
        (item) => item.name.trim().toLowerCase() === QUALITY_ROOT_NAME.toLowerCase(),
      ) ?? albums[0];
    if (!album?.images?.length) return QC_GALLERY;

    return album.images.map((img) => ({
      src: img.url,
      alt: img.alt || album.name,
    }));
  } catch (error) {
    console.error('[getQualityGallery]', error);
    return QC_GALLERY;
  }
}
