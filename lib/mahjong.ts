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
import { categoryBannerCopy, categoryBannerMedia, isVideoMediaUrl } from '@/lib/media';

export {
  isMeaningfulDescription,
  plainTextFromHtml,
  hasRichContent,
} from '@/lib/capabilities';

export { isVideoMediaUrl } from '@/lib/media';

export const MAHJONG_BASE = '/manufacturing/mahjong';
/** Mahjong 入口：直接进入第一个二级栏目，避免停留在 /manufacturing/mahjong */
export const MAHJONG_DEFAULT_TAB = 'mahjong-tiles';
export const MAHJONG_HOME = `${MAHJONG_BASE}/${MAHJONG_DEFAULT_TAB}`;

/** 本地回退：CMS 不可用时使用 */
export const MAHJONG_NAV_FALLBACK = [
  {
    id: 'mahjong-tiles',
    label: 'Mahjong Tiles',
    href: `${MAHJONG_BASE}/mahjong-tiles`,
  },
  {
    id: 'domino-tiles',
    label: 'Domino Tiles',
    href: `${MAHJONG_BASE}/domino-tiles`,
  },
  {
    id: 'letter-symbol-tiles',
    label: 'Letter & Symbol Tiles',
    href: `${MAHJONG_BASE}/letter-symbol-tiles`,
  },
] as const;

export type MahjongTabId = (typeof MAHJONG_NAV_FALLBACK)[number]['id'];

export type MahjongNavItem = {
  id: string;
  label: string;
  href: string;
};

export type MahjongCard = {
  id: string;
  title: string;
  image: string;
  mediaType: 'image' | 'video';
  /** 视频封面（CMS video_cover） */
  poster?: string;
  /** CMS 文章详情页 */
  href?: string;
};

/** 4 列栅格下单卡占列数 */
export type MahjongSpan = 1 | 2 | 4;

/**
 * 按数量自动排布（Insta360 式 4 列规律）：
 * - 1 张：整行
 * - 2 张：1:1（各占 2 列）
 * - 3 张：2:1:1（大卡 + 两小卡）
 * - 4 张：1:1:1:1
 * - 5+：优先拆成上述行组合（如 5→2+3，6→2+4，7→3+4）
 */
export function planMahjongSpans(count: number): MahjongSpan[] {
  return planMahjongRows(count).flatMap(spansForRow);
}

function spansForRow(n: number): MahjongSpan[] {
  if (n <= 1) return [4];
  if (n === 2) return [2, 2];
  if (n === 3) return [2, 1, 1];
  return [1, 1, 1, 1];
}

/** 将总数拆成每行列数（1–4），避免出现落单 1 卡挤在下一行的尴尬 */
export function planMahjongRows(count: number): number[] {
  if (count <= 0) return [];
  if (count <= 4) return [count];

  const rows: number[] = [];
  let left = count;

  while (left > 0) {
    if (left === 1) {
      if (rows.length && rows[rows.length - 1] === 4) {
        rows[rows.length - 1] = 3;
        rows.push(2);
      } else if (rows.length && rows[rows.length - 1] === 2) {
        rows[rows.length - 1] = 3;
      } else {
        rows.push(1);
      }
      left = 0;
    } else if (left === 5) {
      rows.push(2, 3);
      left = 0;
    } else if (left === 6) {
      rows.push(2, 4);
      left = 0;
    } else if (left === 7) {
      rows.push(3, 4);
      left = 0;
    } else if (left <= 4) {
      rows.push(left);
      left = 0;
    } else if (left - 4 === 1) {
      rows.push(3);
      left -= 3;
    } else {
      rows.push(4);
      left -= 4;
    }
  }

  return rows;
}

export type MahjongPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  hero: {
    image: string;
    poster?: string;
    alt: string;
    title?: string;
    subtitle?: string;
  };
  tabs: MahjongNavItem[];
  defaultTabId: string;
};

export type MahjongTabPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  tab: MahjongNavItem;
  cards: MahjongCard[];
  /** 栏目下全部文章数（含非推荐），用于 View More */
  allCount: number;
};

export const MAHJONG_HERO_FALLBACK = '/images/14.jpg';

const LOCAL = {
  a: '/images/history/1986.png',
  b: '/images/history/1987.png',
  c: '/images/history/2005.jpg',
  d: '/images/history/2017.png',
  e: '/images/history/2022.jpg',
  f: '/images/ma/2-2.png',
  g: '/images/14.jpg',
  h: '/images/history/2018.jpg',
};

function imgCard(id: string, image: string): MahjongCard {
  return { id, title: 'Title Title', image, mediaType: 'image' };
}

export const MAHJONG_GALLERY_FALLBACK: Record<MahjongTabId, MahjongCard[]> = {
  'mahjong-tiles': [
    imgCard('mahjong-tiles-1', LOCAL.g),
    imgCard('mahjong-tiles-2', LOCAL.f),
    imgCard('mahjong-tiles-3', LOCAL.b),
    imgCard('mahjong-tiles-4', LOCAL.a),
  ],
  'domino-tiles': [
    imgCard('domino-tiles-1', LOCAL.h),
    imgCard('domino-tiles-2', LOCAL.e),
    imgCard('domino-tiles-3', LOCAL.c),
    imgCard('domino-tiles-4', LOCAL.d),
  ],
  'letter-symbol-tiles': [
    imgCard('letter-symbol-tiles-1', LOCAL.d),
    imgCard('letter-symbol-tiles-2', LOCAL.g),
    imgCard('letter-symbol-tiles-3', LOCAL.a),
    imgCard('letter-symbol-tiles-4', LOCAL.f),
  ],
};

/** @deprecated 使用 MAHJONG_NAV_FALLBACK；保留别名避免旧引用报错 */
export const MAHJONG_NAV = MAHJONG_NAV_FALLBACK;
export const MAHJONG_HERO = MAHJONG_HERO_FALLBACK;
export const MAHJONG_GALLERY = MAHJONG_GALLERY_FALLBACK;

const ROOT_NAME = 'Mahjong';

function findMahjongRoot(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) => item.parent_id == null && item.name === ROOT_NAME,
    ) ??
    categories.find(
      (item) => item.parent_id == null && /^mahjong$/i.test(item.name.trim()),
    ) ??
    null
  );
}

function slugifyName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || ''
  );
}

function tabSlug(category: ProductCategory) {
  const fromKeywords = category.keywords?.trim().toLowerCase();
  if (fromKeywords && /^[a-z0-9-]+$/.test(fromKeywords)) return fromKeywords;
  return slugifyName(category.name) || String(category.id);
}

function mapTabs(children: ProductCategory[]): MahjongNavItem[] {
  return children
    .slice()
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map((item) => {
      const id = tabSlug(item);
      return {
        id,
        label: item.name,
        href: `${MAHJONG_BASE}/${id}`,
      };
    });
}

export function mahjongTabHref(tabId: string) {
  return `${MAHJONG_BASE}/${tabId}`;
}

export function mahjongTabListHref(tabId: string) {
  return `${MAHJONG_BASE}/${tabId}/list`;
}

export function mahjongProductHref(tabId: string, productId: number) {
  return `${MAHJONG_BASE}/${tabId}/${productId}`;
}

function withCardHrefs(tabId: string, cards: MahjongCard[]) {
  return cards.map((card) =>
    /^\d+$/.test(card.id)
      ? { ...card, href: mahjongProductHref(tabId, Number(card.id)) }
      : card,
  );
}

function mapCards(products: ProductListItem[]): MahjongCard[] {
  return products
    .slice()
    .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
    .map((item) => {
      const image = item.cover?.trim() || '';
      const isVideo = Boolean(image) && isVideoMediaUrl(image, item.cover_type);
      const poster = item.video_cover?.trim() || '';
      return {
        id: String(item.id),
        title: item.title,
        image,
        mediaType: isVideo ? ('video' as const) : ('image' as const),
        ...(isVideo && poster ? { poster } : {}),
      };
    });
}

function fallbackPage(): MahjongPageData {
  return {
    meta: {
      title: ROOT_NAME,
      description:
        'Mahjong tiles, domino tiles, and letter & symbol tiles manufactured for board game brands.',
      keywords: 'Mahjong',
    },
    hero: {
      image: MAHJONG_HERO_FALLBACK,
      alt: 'Lijia mahjong products',
    },
    tabs: MAHJONG_NAV_FALLBACK.map((item) => ({ ...item })),
    defaultTabId: MAHJONG_DEFAULT_TAB,
  };
}

/**
 * Mahjong 一级栏目：banner / metadata / tab 导航
 * banner 始终取一级栏目主图，各 Tab 子页共用（不读二级栏目图）
 */
export const getMahjongPageData = cache(async (): Promise<MahjongPageData> => {
  try {
    const categories = await getProductCategories();
    const root = findMahjongRoot(categories);
    if (!root) return fallbackPage();

    const children = categories.filter((item) => item.parent_id === root.id);
    const tabs = mapTabs(children);
    if (!tabs.length) return fallbackPage();

    return {
      meta: {
        title: root.name?.trim() || ROOT_NAME,
        description: root.description?.trim() || undefined,
        keywords: root.keywords?.trim() || undefined,
      },
      hero: {
        image: categoryBannerMedia(root).image || MAHJONG_HERO_FALLBACK,
        poster: categoryBannerMedia(root).poster,
        ...categoryBannerCopy(root),
        alt: root.subtitle?.trim() || root.name || 'Lijia mahjong products',
      },
      tabs,
      defaultTabId: tabs[0].id,
    };
  } catch (error) {
    console.error('[getMahjongPageData]', error);
    return fallbackPage();
  }
});

function fallbackTabPage(
  tab: MahjongNavItem,
  tabId: string,
): MahjongTabPageData {
  const fallbackCards = MAHJONG_GALLERY_FALLBACK[tabId as MahjongTabId] ?? [];
  return {
    meta: { title: tab.label },
    tab,
    cards: fallbackCards,
    allCount: fallbackCards.length,
  };
}

/** 单个 Tab 页：栏目 metadata + 文章卡片；默认仅推荐 */
export async function getMahjongTabPageData(
  tabId: string,
  options?: { all?: boolean },
): Promise<MahjongTabPageData | null> {
  const page = await getMahjongPageData();
  const tab = page.tabs.find((item) => item.id === tabId);
  if (!tab) return null;

  try {
    const categories = await getProductCategories();
    const root = findMahjongRoot(categories);
    if (!root) return fallbackTabPage(tab, tabId);

    const category =
      categories
        .filter((item) => item.parent_id === root.id)
        .find((item) => tabSlug(item) === tabId) ?? null;

    if (!category) return fallbackTabPage(tab, tabId);

    const { list } = await getProducts(1, 100, category.id);
    const recommended = list.filter(
      (item) => Number(item.is_recommended) === 1,
    );
    const source = options?.all ? list : recommended;
    const cards = mapCards(source);
    const resolved =
      cards.length > 0
        ? cards
        : options?.all
          ? (MAHJONG_GALLERY_FALLBACK[tabId as MahjongTabId] ?? [])
          : [];
    return {
      meta: {
        title: category.name?.trim() || tab.label,
        description: category.description?.trim() || undefined,
        keywords: category.keywords?.trim() || undefined,
      },
      tab: {
        id: tabId,
        label: category.name,
        href: `${MAHJONG_BASE}/${tabId}`,
      },
      cards: withCardHrefs(tabId, resolved),
      allCount: list.length,
    };
  } catch (error) {
    console.error('[getMahjongTabPageData]', error);
    return fallbackTabPage(tab, tabId);
  }
}

export async function allMahjongTabParams() {
  const { tabs } = await getMahjongPageData();
  return tabs.map((item) => ({ tab: item.id }));
}

export function isMahjongTabId(
  value: string,
  tabs?: MahjongNavItem[],
): boolean {
  if (tabs?.length) return tabs.some((item) => item.id === value);
  return MAHJONG_NAV_FALLBACK.some((item) => item.id === value);
}

export function getMahjongTab(id: string, tabs?: MahjongNavItem[]) {
  const list = tabs?.length ? tabs : MAHJONG_NAV_FALLBACK;
  return list.find((item) => item.id === id) ?? list[0];
}

/** Mahjong 文章详情（三级页） */
export async function getMahjongProductDetail(
  tabId: string,
  productId: number,
): Promise<{
  product: Product;
  category: ProductCategory;
  tab: MahjongNavItem;
} | null> {
  try {
    const page = await getMahjongPageData();
    const tab = page.tabs.find((item) => item.id === tabId);
    if (!tab) return null;

    const categories = await getProductCategories();
    const root = findMahjongRoot(categories);
    if (!root) return null;

    const category =
      categories
        .filter((item) => item.parent_id === root.id)
        .find((item) => tabSlug(item) === tabId) ?? null;
    if (!category) return null;

    const product = await getProduct(productId);
    if (!product || product.category_id !== category.id) return null;

    return { product, category, tab };
  } catch (error) {
    console.error('[getMahjongProductDetail]', error);
    return null;
  }
}

export async function allMahjongProductParams() {
  try {
    const page = await getMahjongPageData();
    const categories = await getProductCategories();
    const root = findMahjongRoot(categories);
    if (!root) return [];

    const children = categories.filter((item) => item.parent_id === root.id);
    const params: { tab: string; productId: string }[] = [];

    for (const child of children) {
      const tabId = tabSlug(child);
      if (!page.tabs.some((item) => item.id === tabId)) continue;
      const { list } = await getProducts(1, 100, child.id);
      for (const item of list) {
        params.push({ tab: tabId, productId: String(item.id) });
      }
    }

    return params;
  } catch (error) {
    console.error('[allMahjongProductParams]', error);
    return [];
  }
}
