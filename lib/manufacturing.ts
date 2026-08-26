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

export type MfgComponent = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  iconHover: string;
  href: string;
};

export function manufacturingDetailHref(productId: string | number) {
  return `/manufacturing/${productId}`;
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
    href: '/manufacturing',
  },
  {
    id: 'mahjong',
    title: 'Mahjong',
    desc: DEFAULT_DESC,
    icon: '/images/ma/2-1.png',
    iconHover: '/images/ma/2-2.png',
    href: '/manufacturing/mahjong',
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

function mapProductToComponent(product: ProductListItem): MfgComponent {
  const customHref =
    Number(product.use_custom_link) === 1
      ? product.custom_link?.trim() || ''
      : '';

  return {
    id: String(product.id),
    title: product.title,
    desc: product.description?.trim() || '',
    icon: product.icon?.trim() || product.cover?.trim() || '',
    iconHover: product.hover_icon?.trim() || product.icon?.trim() || '',
    href: customHref || manufacturingDetailHref(product.id),
  };
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
  category: ProductCategory | null;
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

    const category =
      categories.find((item) => item.id === product.category_id) ?? root;
    return { product, category };
  } catch (error) {
    console.error('[getManufacturingProductDetail]', error);
    return null;
  }
}

export async function allManufacturingProductParams() {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return [];

    const { list } = await getProducts(1, 100, root.id);
    return list
      .filter((item) => Number(item.use_custom_link) !== 1)
      .map((item) => ({ id: String(item.id) }));
  } catch {
    return [];
  }
}

export {
  isMeaningfulDescription,
  plainTextFromHtml,
  hasRichContent,
} from '@/lib/capabilities';

function pageFromCategory(
  category: ProductCategory | null,
  products: ProductListItem[],
): ManufacturingPageData {
  const name = category?.name?.trim() || MFG_ROOT_NAME;
  const items = products.length
    ? products
        .slice()
        .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
        .map(mapProductToComponent)
        .filter((item) => item.icon)
    : MFG_COMPONENTS;

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

/** Manufacturing：一级栏目 metadata / banner + 栏目下文章组件列表 */
export const getManufacturingPageData = cache(async (): Promise<ManufacturingPageData> => {
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return pageFromCategory(null, []);

    const { list } = await getProducts(1, 100, root.id);
    return pageFromCategory(root, list);
  } catch (error) {
    console.error('[getManufacturingPageData]', error);
    return pageFromCategory(null, []);
  }
});

/** 首页 Game Development Components：Manufacturing 下推荐文章 */
export const getHomeManufacturingComponents = cache(async (
  limit = 6,
): Promise<MfgComponent[]> => {
  const fallback = MFG_COMPONENTS.slice(0, limit);
  try {
    const categories = await getProductCategories();
    const root = findMfgRoot(categories);
    if (!root) return fallback;

    const { list } = await getProducts(1, 100, root.id, {
      isRecommended: true,
    });
    const items = list
      .slice()
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
      .map(mapProductToComponent)
      .filter((item) => item.icon)
      .slice(0, limit);

    return items.length ? items : fallback;
  } catch (error) {
    console.error('[getHomeManufacturingComponents]', error);
    return fallback;
  }
});
