import { getProductCategories, getProducts, type ProductListItem } from '@/lib/cms';

export type StoryNode = {
  year: string;
  title: string;
  body: string;
  image: string;
  keywords?: string;
};

const STORY_CATEGORY_NAME = 'Our Story & Philosophy';

export const ABOUT_NAV = [
  { href: '/about/history', label: 'Our Story & Philosophy' },
  { href: '/about/facilities', label: 'Our Facilities' },
  { href: '/about/team', label: 'Our Team' },
  { href: '/about/news', label: 'News & Events' },
] as const;

function productToStoryNode(item: ProductListItem): StoryNode {
  return {
    year: item.title,
    title: item.subtitle || '',
    body: item.description || '',
    image: item.cover || '',
    keywords: item.keywords || '',
  };
}

/** 从 CMS「Our Story & Philosophy」栏目读取时间线 */
export async function getStoryNodes(): Promise<StoryNode[]> {
  try {
    const categories = await getProductCategories();
    const category =
      categories.find((c) => c.name === STORY_CATEGORY_NAME) ??
      categories.find((c) => /our\s+story/i.test(c.name));

    if (!category) return [];

    const { list } = await getProducts(1, 100, category.id);
    if (!list.length) return [];

    return [...list]
      .map(productToStoryNode)
      .filter((n) => n.year && n.image)
      .sort((a, b) => Number(b.year) - Number(a.year) || b.year.localeCompare(a.year));
  } catch (error) {
    console.error('[getStoryNodes]', error);
    return [];
  }
}
