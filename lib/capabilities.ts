import { cache } from 'react';
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
import { categoryBannerCopy, categoryBannerMedia } from '@/lib/media';
import { contentSlug, resolveContentParam } from '@/lib/slug';

export const CAPABILITIES_NAV = [
  { href: '/capabilities/scope', label: 'Scope of capabilities' },
  { href: '/capabilities/quality', label: 'Quality Control' },
] as const;

export type ScopeTag = {
  id: number;
  title: string;
  description: string;
  cover: string;
  /** 详情页 URL 段（标题 slug） */
  slug: string;
};

export type ScopeItem = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  image: string;
  /** 栏目 URL 段 */
  slug: string;
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

/** banner 叠字只取 banner_title / banner_subtitle，空则不展示 */
function capHeroFromCategory(category: ProductCategory | null) {
  const media = categoryBannerMedia(category);
  const copy = categoryBannerCopy(category);
  return {
    image: media.image || category?.thumbnail?.trim() || '',
    poster: media.poster,
    title: copy.title,
    subtitle: copy.subtitle,
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
    hero: capHeroFromCategory(category),
  };
}

/** Quality Control：一级栏目 → metadata / banner */
export const getQualityPageData = cache(async (): Promise<QualityPageData> => {
  try {
    const categories = await getProductCategories();
    return qualityFromCategory(findQualityRoot(categories));
  } catch (error) {
    console.error('[getQualityPageData]', error);
    return qualityFromCategory(null);
  }
});

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

function slugifyScopeName(name: string) {
  return (
    String(name || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || ''
  );
}

/** 栏目段：keywords 若已是纯 slug 则用之，否则标题 slugify；空则回退 id */
export function scopeCategorySlug(category: {
  id: number;
  name: string;
  keywords?: string;
}) {
  const kw = String(category.keywords || '')
    .trim()
    .toLowerCase();
  if (kw && /^[a-z0-9-]+$/.test(kw)) return kw;
  return slugifyScopeName(category.name) || String(category.id);
}

export function scopeProductSlug(title: string, id?: string | number) {
  const base = slugifyScopeName(title);
  if (base) return base;
  return id != null ? String(id) : '';
}

/** 同栏目内产品 slug 冲突时追加 -{id} */
export function scopeProductSlugMap(products: { id: number; title: string }[]) {
  const bases = products.map((p) => ({
    id: p.id,
    base: scopeProductSlug(p.title, p.id),
  }));
  const counts = new Map<string, number>();
  for (const item of bases) {
    counts.set(item.base, (counts.get(item.base) || 0) + 1);
  }
  const map = new Map<number, string>();
  for (const item of bases) {
    map.set(
      item.id,
      (counts.get(item.base) || 0) > 1 ? `${item.base}-${item.id}` : item.base,
    );
  }
  return map;
}

export function scopeTagHref(
  category: { id: number; name?: string; keywords?: string; slug?: string } | string | number,
  product: { id: number | string; title?: string; slug?: string } | string | number,
) {
  const categorySlug =
    typeof category === 'object'
      ? category.slug ||
        scopeCategorySlug({
          id: category.id,
          name: category.name || '',
          keywords: category.keywords,
        })
      : String(category);
  const productSlug =
    typeof product === 'object'
      ? product.slug || scopeProductSlug(product.title || '', product.id)
      : String(product);
  return `/capabilities/scope/${categorySlug}/${productSlug}`;
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
export const getHomeCapabilityPanels = cache(async (
  limit = 3,
): Promise<HomeCapabilityPanel[]> => {
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
});

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

export const getScopePageData = cache(async (): Promise<ScopePageData> => {
  try {
    const categories = await getProductCategories();
    const root = findScopeRoot(categories);
    if (!root) {
      return {
        meta: scopeMetaFromRoot(null),
        hero: capHeroFromCategory(null),
        items: [],
      };
    }

    const children = categories
      .filter((item) => item.parent_id === root.id)
      .sort((a, b) => a.sort - b.sort || a.id - b.id);

    const { list: products } = await getProducts(1, 100, root.id);
    const productsByCategory = mapProductsByCategory(products);

    const items: ScopeItem[] = children.map((category, index) => {
      const products = productsByCategory.get(category.id) ?? [];
      const productSlugs = scopeProductSlugMap(products);
      return {
        id: category.id,
        title: category.name,
        slug: scopeCategorySlug(category),
        subtitle: category.subtitle || category.description || '',
        icon:
          category.thumbnail ||
          category.image ||
          SCOPE_ICONS[index % SCOPE_ICONS.length],
        image: category.image || DEFAULT_SCOPE_IMAGE,
        tags: products.map((product) => ({
          id: product.id,
          title: product.title,
          slug:
            productSlugs.get(product.id) ||
            scopeProductSlug(product.title, product.id),
          description: product.description || '',
          cover: product.cover || '',
        })),
      };
    });

    return {
      meta: scopeMetaFromRoot(root),
      hero: capHeroFromCategory(root),
      items,
    };
  } catch (error) {
    console.error('[getScopePageData]', error);
    return {
      meta: scopeMetaFromRoot(null),
      hero: capHeroFromCategory(null),
      items: [],
    };
  }
});

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

/** 按栏目 slug + 产品标题 slug（或旧数字 id）解析详情 */
export async function getScopeProductByParam(
  categoryParam: string,
  productParam: string,
): Promise<{
  product: Product;
  category: ProductCategory;
  image: string;
  categorySlug: string;
  productSlug: string;
} | null> {
  try {
    const categories = await getProductCategories();
    const root = findScopeRoot(categories);
    if (!root) return null;

    const children = categories.filter((item) => item.parent_id === root.id);
    const catParam = categoryParam.trim();
    const category =
      children.find((item) => scopeCategorySlug(item) === catParam) ??
      ( /^\d+$/.test(catParam)
        ? children.find((item) => item.id === Number(catParam))
        : undefined) ??
      null;
    if (!category) return null;

    const categorySlug = scopeCategorySlug(category);
    const { list } = await getProducts(1, 200, category.id);
    const siblings = list.filter((item) => item.category_id === category.id);
    const slugMap = scopeProductSlugMap(siblings);

    const prodParam = productParam.trim();
    let productId: number | null = null;

    if (/^\d+$/.test(prodParam)) {
      productId = Number(prodParam);
    } else {
      for (const [id, slug] of slugMap) {
        if (slug === prodParam) {
          productId = id;
          break;
        }
      }
    }
    if (productId == null) return null;

    const data = await getScopeProductDetail(category.id, productId);
    if (!data?.product || !data.category) return null;

    return {
      product: data.product,
      category: data.category,
      image: data.image,
      categorySlug,
      productSlug:
        slugMap.get(productId) ||
        scopeProductSlug(data.product.title, productId),
    };
  } catch (error) {
    console.error('[getScopeProductByParam]', error);
    return null;
  }
}

export async function allScopeProductParams() {
  try {
    const categories = await getProductCategories();
    const root = findScopeRoot(categories);
    if (!root) return [];

    const children = categories.filter((item) => item.parent_id === root.id);
    const params: { categoryId: string; productId: string }[] = [];

    for (const category of children) {
      const { list } = await getProducts(1, 200, category.id);
      const siblings = list.filter((item) => item.category_id === category.id);
      const slugMap = scopeProductSlugMap(siblings);
      const categorySlug = scopeCategorySlug(category);
      for (const item of siblings) {
        params.push({
          categoryId: categorySlug,
          productId:
            slugMap.get(item.id) || scopeProductSlug(item.title, item.id),
        });
      }
    }

    return params;
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

/** 富文本是否有可展示内容（纯文字，或图片/视频等媒体） */
export function hasRichContent(html: string) {
  const value = html.trim();
  if (!value) return false;
  if (plainTextFromHtml(value)) return true;
  return /<(img|video|iframe|embed|object|figure|table|ul|ol|blockquote)\b/i.test(
    value,
  );
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
    icon: 'https://images.wangsanshui.com/images/1787230866540-eus7ro.png',
  },
  {
    id: 'ipqc',
    label: 'IPQC: In Process Quality Control',
    icon: 'https://images.wangsanshui.com/images/1787230866814-ngx76d.png',
  },
  {
    id: 'fqc',
    label: 'FQC: Final Quality Control',
    icon: 'https://images.wangsanshui.com/images/1787230866731-igmes3.png',
  },
  {
    id: 'oqc',
    label: 'OQC: Outgoing Quality Control',
    icon: 'https://images.wangsanshui.com/images/1787230866608-ifw759.png',
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

export type QualityAlbum = {
  id: string;
  label: string;
  images: QualityGalleryImage[];
};

/** Quality Control：CMS 图集（路径段为名称 slug） */
export const getQualityAlbum = cache(async (): Promise<QualityAlbum | null> => {
  try {
    const albums = await getAlbums([QUALITY_ROOT_NAME]);
    const album =
      albums.find(
        (item) => item.name.trim().toLowerCase() === QUALITY_ROOT_NAME.toLowerCase(),
      ) ?? albums[0];
    if (!album?.images?.length) return null;

    return {
      id: contentSlug(album.name, album.id),
      label: album.name,
      images: album.images.map((img) => ({
        src: img.url,
        alt: img.alt || album.name,
      })),
    };
  } catch (error) {
    console.error('[getQualityAlbum]', error);
    return null;
  }
});

/** Quality Control 图集 → 跑马灯画廊 */
export const getQualityGallery = cache(async (): Promise<QualityGalleryImage[]> => {
  const album = await getQualityAlbum();
  return album?.images?.length ? album.images : QC_GALLERY;
});

export async function getQualityAlbumById(
  id: string,
): Promise<QualityAlbum | null> {
  try {
    const albums = await getAlbums([QUALITY_ROOT_NAME]);
    const candidates = albums
      .filter((item) => item.images?.length)
      .map((item) => ({ id: item.id, title: item.name }));
    const resolved = resolveContentParam(candidates, id);
    if (!resolved) return null;
    const raw = albums.find((item) => item.id === resolved.id);
    if (!raw?.images?.length) return null;
    return {
      id: resolved.slug,
      label: raw.name,
      images: raw.images.map((img) => ({
        src: img.url,
        alt: img.alt || raw.name,
      })),
    };
  } catch {
    return null;
  }
}

export async function getQualityAlbumParams(): Promise<{ id: string }[]> {
  const album = await getQualityAlbum();
  return album ? [{ id: album.id }] : [];
}
