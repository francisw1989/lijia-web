import { cache } from 'react';
import {
  getProduct,
  getProductCategories,
  getProducts,
  compareBySortThen,
  type Product,
  type ProductCategory,
  type ProductListItem,
} from '@/lib/cms';
import { categoryBannerMedia } from '@/lib/media';
import {
  isMeaningfulDescription,
  plainTextFromHtml,
} from '@/lib/capabilities';

const MAHJONG_HOME = '/manufacturing/mahjong/mahjong-tiles';

export const MFG_PAGE_SIZE = 12;

export function slugifyMfgName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || ''
  );
}

export function isMahjongCategory(category: { name?: string; keywords?: string }) {
  return (
    /^\s*mahjong\s*$/i.test(category.name || '') ||
    /^mahjong$/i.test(category.keywords || '')
  );
}

export function manufacturingSectionSlug(category: {
  id: number;
  name: string;
  keywords?: string;
}) {
  const kw = category.keywords?.trim().toLowerCase();
  if (kw && /^[a-z0-9-]+$/.test(kw)) return kw;
  return slugifyMfgName(category.name) || String(category.id);
}

export function manufacturingCategoryHref(
  category: { id: number; name: string; keywords?: string } | string | number,
) {
  if (typeof category === 'object') {
    if (isMahjongCategory(category)) return MAHJONG_HOME;
    return `/manufacturing/${manufacturingSectionSlug(category)}`;
  }
  return `/manufacturing/${category}`;
}

export function manufacturingProductHref(
  section: { id: number; name: string; keywords?: string } | string | number,
  productId: string | number,
) {
  const slug =
    typeof section === 'object' ? manufacturingSectionSlug(section) : String(section);
  return `/manufacturing/${slug}/${productId}`;
}

export type MfgComponent = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  iconHover: string;
  /** 列表封面：栏目缩略图 / banner / 图标 */
  image?: string;
  href: string;
};

export function paginateItems<T>(items: T[], page: number, pageSize = MFG_PAGE_SIZE) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const current = Math.min(pageCount, Math.max(1, Number.isFinite(page) ? page : 1));
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    total,
  };
}

const MFG_ROOT_NAME = 'Manufacturing';

const DEFAULT_DESC =
  'In addition to coins that are punched out of token boards, we can also manufacture coinage in paper, wood, plastic or metal.';

/** 前 6 项顺序对齐首页 Game Development Components（CMS 不可用时回退） */
export const MFG_COMPONENTS: MfgComponent[] = [
  {
    id: 'game-card',
    title: 'Game card',
    desc: DEFAULT_DESC,
    icon: '/images/ma/1-1.png',
    iconHover: '/images/ma/1-2.png',
    image: '/images/ma/1-1.png',
    href: '/manufacturing',
  },
  {
    id: 'mahjong',
    title: 'Mahjong',
    desc: DEFAULT_DESC,
    icon: '/images/ma/2-1.png',
    iconHover: '/images/ma/2-2.png',
    href: '/manufacturing/mahjong/mahjong-tiles',
  },
  {
    id: 'pcb',
    title: 'PCB',
    desc: DEFAULT_DESC,
    icon: '/images/ma/3-1.png',
    iconHover: '/images/ma/3-2.png',
    href: '/manufacturing',
  },
  {
    id: 'chip',
    title: 'Chip',
    desc: 'We produce cardboard, plastic, wood and metal Chips in many sizes.',
    icon: '/images/ma/4-1.png',
    iconHover: '/images/ma/4-2.png',
    href: '/manufacturing',
  },
  {
    id: 'coin',
    title: 'Coin',
    desc: DEFAULT_DESC,
    icon: '/images/ma/5-1.png',
    iconHover: '/images/ma/5-2.png',
    href: '/manufacturing',
  },
  {
    id: 'marker',
    title: 'Marker',
    desc: DEFAULT_DESC,
    icon: '/images/ma/6-1.png',
    iconHover: '/images/ma/6-2.png',
    href: '/manufacturing',
  },
  {
    id: 'box',
    title: 'Box',
    desc: DEFAULT_DESC,
    icon: '/images/ma/7-1.png',
    iconHover: '/images/ma/7-2.png',
    href: '/manufacturing',
  },
  {
    id: 'card-stand',
    title: 'Card stand',
    desc: 'We have tooling to produce plastic Card Stands for different thickness of cards.',
    icon: '/images/ma/8-1.png',
    iconHover: '/images/ma/8-2.png',
    href: '/manufacturing',
  },
  {
    id: 'dice',
    title: 'Dice',
    desc: DEFAULT_DESC,
    icon: '/images/ma/9-1.png',
    iconHover: '/images/ma/9-2.png',
    href: '/manufacturing',
  },
  {
    id: 'gameboard',
    title: 'Gameboard',
    desc: DEFAULT_DESC,
    icon: '/images/ma/10-1.png',
    iconHover: '/images/ma/10-2.png',
    href: '/manufacturing',
  },
  {
    id: 'inlay',
    title: 'Inlay',
    desc: DEFAULT_DESC,
    icon: '/images/ma/11-1.png',
    iconHover: '/images/ma/11-2.png',
    href: '/manufacturing',
  },
  {
    id: 'meeple',
    title: 'Meeple',
    desc: DEFAULT_DESC,
    icon: '/images/ma/12-1.png',
    iconHover: '/images/ma/12-2.png',
    href: '/manufacturing',
  },
  {
    id: 'miniature',
    title: 'Miniature',
    desc: DEFAULT_DESC,
    icon: '/images/ma/13-1.png',
    iconHover: '/images/ma/13-2.png',
    href: '/manufacturing',
  },
  {
    id: 'pouch',
    title: 'Pouch',
    desc: DEFAULT_DESC,
    icon: '/images/ma/14-1.png',
    iconHover: '/images/ma/14-2.png',
    href: '/manufacturing',
  },
  {
    id: 'timer',
    title: 'Timer',
    desc: DEFAULT_DESC,
    icon: '/images/ma/15-1.png',
    iconHover: '/images/ma/15-2.png',
    href: '/manufacturing',
  },
  {
    id: 'play-mat',
    title: 'Play-mat',
    desc: DEFAULT_DESC,
    icon: '/images/ma/16-1.png',
    iconHover: '/images/ma/16-2.png',
    href: '/manufacturing',
  },
];

export const MFG_HERO = {
  image: '/images/14.jpg',
  title:
    'When turning your original game idea into a sell‑ready physical product, brand creators often face these key challenges:',
  questions: [
    {
      mark: 'A',
      text: "Which components best fit your game mechanics? (Dice, meeples, game boards, tokens and more)",
    },
    {
      mark: 'B',
      text: 'What material options exist for your parts, and how do you pick the best fit? (Plastic, metal, wood, paper‑based materials)',
    },
    {
      mark: 'C',
      text: 'How do you balance production costs against your target retail price?',
    },
    {
      mark: 'D',
      text: 'How to design practical packaging for convenient storage and quick setup for end‑users?',
    },
  ],
  concern:
    'What other critical factors should you consider, such as toy‑safety compliance and global shipment arrangements?',
  closing:
    "Our in‑house project team supports you through all these decision‑making points. Share your component list with us, and reach out: ",
  email: 'info@lijiagames.com',
} as const;

export type ManufacturingPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  hero: {
    image: string;
    poster?: string;
    title: string;
    questions: readonly { mark: string; text: string }[];
    concern: string;
    closing: string;
    email: string;
  };
  items: MfgComponent[];
};

function findMfgRoot(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) => item.parent_id == null && item.name === MFG_ROOT_NAME,
    ) ??
    categories.find(
      (item) => item.parent_id == null && /manufacturing/i.test(item.name),
    ) ??
    null
  );
}

function categoryGalleryImage(category: ProductCategory) {
  return (
    category.thumbnail?.trim() ||
    category.image?.trim() ||
    category.icon?.trim() ||
    ''
  );
}

function mapCategoryToComponent(category: ProductCategory): MfgComponent {
  return {
    id: String(category.id),
    title: category.name,
    desc: category.description?.trim() || category.subtitle?.trim() || '',
    icon: category.icon?.trim() || '',
    iconHover: category.hover_icon?.trim() || category.icon?.trim() || '',
    image: categoryGalleryImage(category),
    href: manufacturingCategoryHref(category),
  };
}

function mapProductToComponent(
  product: ProductListItem,
  section?: ProductCategory | number | null,
): MfgComponent {
  const customHref =
    Number(product.use_custom_link) === 1
      ? product.custom_link?.trim() || ''
      : '';
  const slug =
    section && typeof section === 'object'
      ? manufacturingSectionSlug(section)
      : section != null
        ? String(section)
        : product.category_id != null
          ? String(product.category_id)
          : '';

  return {
    id: String(product.id),
    title: product.title,
    desc: product.description?.trim() || '',
    icon: product.icon?.trim() || product.cover?.trim() || '',
    iconHover: product.hover_icon?.trim() || product.icon?.trim() || '',
    image:
      product.cover?.trim() ||
      product.video_cover?.trim() ||
      product.icon?.trim() ||
      '',
    href: customHref || (slug ? manufacturingProductHref(slug, product.id) : '/manufacturing'),
  };
}

/** 一级页卡片：进入二级列表 /manufacturing/{slug} */
function mapProductToSection(product: ProductListItem): MfgComponent {
  const item = mapProductToComponent(product);
  const customHref =
    Number(product.use_custom_link) === 1
      ? product.custom_link?.trim() || ''
      : '';
  return {
    ...item,
    href: customHref || manufacturingCategoryHref(product.id),
  };
}

function manufacturingL2ForCategory(
  categories: ProductCategory[],
  rootId: number,
  categoryId: number | null,
) {
  if (categoryId == null) return null;
  const byId = new Map(categories.map((item) => [item.id, item]));
  let current = byId.get(categoryId);
  let guard = 0;
  while (current && guard < 20) {
    if (current.parent_id === rootId) return current;
    if (current.id === rootId || current.parent_id == null) return null;
    current = byId.get(current.parent_id);
    guard += 1;
  }
  return null;
}

function findMfgSectionBySlug(
  categories: ProductCategory[],
  root: ProductCategory,
  slug: string,
) {
  const sections = categories.filter((item) => item.parent_id === root.id);
  const normalized = slug.trim().toLowerCase();
  return (
    sections.find((item) => manufacturingSectionSlug(item) === normalized) ??
    sections.find((item) => String(item.id) === slug) ??
    null
  );
}

function isUnderManufacturing(
  categories: ProductCategory[],
  categoryId: number | null,
  rootId: number,
) {
  if (categoryId == null) return false;
  if (categoryId === rootId) return true;
  const byId = new Map(categories.map((item) => [item.id, item]));
  let current = byId.get(categoryId);
  let guard = 0;
  while (current && guard < 20) {
    if (current.id === rootId) return true;
    if (!current.parent_id) return false;
    current = byId.get(current.parent_id);
    guard += 1;
  }
  return false;
}

export async function getManufacturingProductDetail(productId: number): Promise<{
  product: Product;
  category: ProductCategory;
} | null> {
  try {
    const [product, categories] = await Promise.all([
      getProduct(productId),
      getProductCategories(),
    ]);
    if (!product) return null;

    const root = findMfgRoot(categories);
    if (!root) return null;
    if (!isUnderManufacturing(categories, product.category_id, root.id)) {
      return null;
    }

    const section = manufacturingL2ForCategory(
      categories,
      root.id,
      product.category_id,
    );
    if (!section || isMahjongCategory(section)) return null;
    if (product.category_id !== section.id) return null;

    return { product, category: section };
  } catch (error) {
    console.error('[getManufacturingProductDetail]', error);
    return null;
  }
}

export async function allManufacturingCategoryParams() {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return [];

    return categories
      .filter((item) => item.parent_id === root.id && !isMahjongCategory(item))
      .map((item) => ({ id: manufacturingSectionSlug(item) }));
  } catch {
    return [];
  }
}

export async function allManufacturingProductParams() {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return [];

    const sections = categories.filter(
      (item) => item.parent_id === root.id && !isMahjongCategory(item),
    );
    const params: { id: string; productId: string }[] = [];

    for (const section of sections) {
      const { list } = await getProducts(1, 100, section.id);
      for (const item of list) {
        if (item.category_id !== section.id) continue;
        if (Number(item.use_custom_link) === 1) continue;
        params.push({
          id: manufacturingSectionSlug(section),
          productId: String(item.id),
        });
      }
    }

    return params;
  } catch {
    return [];
  }
}

/** 旧数字 URL：二级栏目 id → slug；文章 id → /manufacturing/{slug}/{id} */
export async function resolveManufacturingNumericRedirect(id: number) {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return null;

    const section = categories.find(
      (item) => item.id === id && item.parent_id === root.id,
    );
    if (section) return manufacturingCategoryHref(section);

    const product = await getProduct(id);
    if (!product) return null;
    if (Number(product.use_custom_link) === 1 && product.custom_link?.trim()) {
      return product.custom_link.trim();
    }
    if (!isUnderManufacturing(categories, product.category_id, root.id)) {
      return null;
    }

    const productCat =
      categories.find((item) => item.id === product.category_id) ?? null;
    const l2 = manufacturingL2ForCategory(
      categories,
      root.id,
      product.category_id,
    );
    if (!l2) return null;
    if (isMahjongCategory(l2)) {
      if (productCat && productCat.id !== l2.id) {
        return `/manufacturing/mahjong/${manufacturingSectionSlug(productCat)}/${product.id}`;
      }
      return MAHJONG_HOME;
    }
    return manufacturingProductHref(l2, product.id);
  } catch {
    return null;
  }
}

export {
  isMeaningfulDescription,
  plainTextFromHtml,
  hasRichContent,
} from '@/lib/capabilities';

function pageFromCategory(
  category: ProductCategory | null,
  children: ProductCategory[],
  products: ProductListItem[],
): ManufacturingPageData {
  const name = category?.name?.trim() || MFG_ROOT_NAME;
  const fromChildren = children
    .slice()
    .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
    .map(mapCategoryToComponent);

  const fromProducts = products
    .slice()
    .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
    .map(mapProductToSection)
    .filter((item) => item.image || item.icon);

  const items = fromChildren.length
    ? fromChildren
    : fromProducts.length
      ? fromProducts
      : MFG_COMPONENTS.map((item) => ({
          ...item,
          href:
            item.id === 'mahjong'
              ? MAHJONG_HOME
              : `/manufacturing/${item.id}`,
        }));

  return {
    meta: {
      title: name,
      description: category?.description?.trim() || undefined,
      keywords: category?.keywords?.trim() || undefined,
    },
    hero: {
      ...MFG_HERO,
      image: categoryBannerMedia(category).image || MFG_HERO.image,
      poster: categoryBannerMedia(category).poster,
    },
    items,
  };
}

export type ManufacturingNavItem = {
  id: string;
  label: string;
  href: string;
};

/** 二级栏目左侧导航：与一级页卡片同一批栏目 */
export const getManufacturingNavItems = cache(async (): Promise<ManufacturingNavItem[]> => {
  const { items } = await getManufacturingPageData();
  return items.map((item) => ({
    id: item.id,
    label: item.title,
    href: item.href,
  }));
});

/** Manufacturing：一级栏目 metadata / banner + 二级栏目列表 */
export const getManufacturingPageData = cache(async (): Promise<ManufacturingPageData> => {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return pageFromCategory(null, [], []);

    const children = categories.filter((item) => item.parent_id === root.id);
    const { list } = children.length
      ? { list: [] as ProductListItem[] }
      : await getProducts(1, 100, root.id);
    return pageFromCategory(root, children, list);
  } catch (error) {
    console.error('[getManufacturingPageData]', error);
    return pageFromCategory(null, [], []);
  }
});

export type ManufacturingCategoryPage = {
  root: ProductCategory;
  category: ProductCategory;
  hero: { image: string; poster?: string };
  articles: MfgComponent[];
};

export const getManufacturingCategoryPage = cache(async (
  slug: string,
): Promise<ManufacturingCategoryPage | null> => {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return null;

    const category = findMfgSectionBySlug(categories, root, slug);
    if (!category) return null;

    const { list } = await getProducts(1, 100, category.id);
    const articles = list
      .filter((item) => item.category_id === category.id)
      .slice()
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
      .map((item) => {
        const mapped = mapProductToComponent(item, category);
        return {
          ...mapped,
          image: mapped.image || category.icon?.trim() || '',
        };
      });

    const banner = categoryBannerMedia(category);
    const rootBanner = categoryBannerMedia(root);

    return {
      root,
      category,
      hero: {
        image: banner.image || rootBanner.image || MFG_HERO.image,
        poster: banner.poster || rootBanner.poster,
      },
      articles,
    };
  } catch (error) {
    console.error('[getManufacturingCategoryPage]', error);
    return null;
  }
});

/** 首页 Game Development Components：Manufacturing 下推荐二级栏目 */
export const getHomeManufacturingComponents = cache(async (
  limit = 6,
): Promise<MfgComponent[]> => {
  const fallback = MFG_COMPONENTS.slice(0, limit);
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return fallback;

    const children = categories
      .filter((item) => item.parent_id === root.id)
      .slice()
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id));

    if (children.length) {
      const recommended = children.filter((item) => Number(item.is_recommended) === 1);
      const pool = recommended.length ? recommended : children;
      const items = pool
        .map(mapCategoryToComponent)
        .filter((item) => item.icon)
        .slice(0, limit);
      return items.length ? items : fallback;
    }

    const { list } = await getProducts(1, 100, root.id, {
      isRecommended: true,
    });
    const items = list
      .slice()
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
      .map(mapProductToSection)
      .filter((item) => item.icon)
      .slice(0, limit);

    return items.length ? items : fallback;
  } catch (error) {
    console.error('[getHomeManufacturingComponents]', error);
    return fallback;
  }
});
