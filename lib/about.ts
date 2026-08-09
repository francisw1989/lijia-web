import {
  getAlbums,
  getProductCategories,
  getProducts,
  type Album,
  type ProductCategory,
} from '@/lib/cms';

export type AboutSectionKey = 'history' | 'facilities' | 'team' | 'news';

export type AboutSectionData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  banner: {
    image: string;
    alt: string;
  };
  categoryId: number | null;
};

export type FacilityAlbumTab = {
  id: string;
  label: string;
  images: { src: string; alt: string }[];
};

/** Our Facilities 前台固定使用的四个图集分类名 */
export const FACILITY_ALBUM_NAMES = [
  'Building',
  'Environment',
  'Machine',
  'Working condition',
] as const;

const ABOUT_SECTIONS: Record<
  AboutSectionKey,
  {
    categoryName: string;
    fallbackTitle: string;
  }
> = {
  history: {
    categoryName: 'Our Story & Philosophy',
    fallbackTitle: 'Our Story & Philosophy',
  },
  facilities: {
    categoryName: 'Our Facilities',
    fallbackTitle: 'Our Facilities',
  },
  team: {
    categoryName: 'Our Team',
    fallbackTitle: 'Our Team',
  },
  news: {
    categoryName: 'News & Events',
    fallbackTitle: 'News & Events',
  },
};

function findAboutCategory(
  categories: ProductCategory[],
  categoryName: string,
): ProductCategory | null {
  const aboutRoot =
    categories.find(
      (item) => item.parent_id == null && item.name === 'About Us',
    ) ??
    categories.find(
      (item) => item.parent_id == null && /about\s*us/i.test(item.name),
    );

  if (aboutRoot) {
    const child = categories.find(
      (item) =>
        item.parent_id === aboutRoot.id && item.name === categoryName,
    );
    if (child) return child;
  }

  return categories.find((item) => item.name === categoryName) ?? null;
}

function sectionFromCategory(
  key: AboutSectionKey,
  category: ProductCategory | null,
): AboutSectionData {
  const conf = ABOUT_SECTIONS[key];
  const title = category?.name?.trim() || conf.fallbackTitle;
  const description = category?.description?.trim() || undefined;
  const keywords = category?.keywords?.trim() || undefined;

  return {
    meta: { title, description, keywords },
    banner: {
      image: category?.image?.trim() || '',
      alt: keywords || category?.subtitle?.trim() || title,
    },
    categoryId: category?.id ?? null,
  };
}

function albumsToTabs(albums: Album[]): FacilityAlbumTab[] {
  return albums
    .filter((album) => album.images?.length)
    .map((album) => ({
      id: String(album.id),
      label: album.name,
      images: album.images.map((img) => ({
        src: img.url,
        alt: img.alt || album.name,
      })),
    }));
}

/** 四个 About 子页：metadata / banner 来自对应二级栏目 */
export async function getAboutSection(
  key: AboutSectionKey,
): Promise<AboutSectionData> {
  const conf = ABOUT_SECTIONS[key];
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(categories, conf.categoryName);
    return sectionFromCategory(key, category);
  } catch (error) {
    console.error(`[getAboutSection:${key}]`, error);
    return sectionFromCategory(key, null);
  }
}

/** Our Facilities：按固定四个图集分类拉取 */
export async function getFacilityAlbums(): Promise<FacilityAlbumTab[]> {
  try {
    const albums = await getAlbums([...FACILITY_ALBUM_NAMES]);
    const byName = new Map(
      albums.map((album) => [album.name.trim().toLowerCase(), album]),
    );
    const ordered = FACILITY_ALBUM_NAMES.map(
      (name) => byName.get(name.toLowerCase()),
    ).filter((album): album is Album => Boolean(album));

    return albumsToTabs(ordered);
  } catch (error) {
    console.error('[getFacilityAlbums]', error);
    return [];
  }
}

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  image: string;
};

export type TeamGalleryImage = {
  src: string;
  alt: string;
};

/** Our Team：栏目下文章 → 成员卡片 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.team.categoryName,
    );
    if (!category) return [];

    const { list } = await getProducts(1, 100, category.id);
    return [...list]
      .filter((item) => item.cover)
      .sort((a, b) => a.id - b.id)
      .map((item) => ({
        id: item.id,
        name: item.title,
        role: item.subtitle || '',
        image: item.cover,
      }));
  } catch (error) {
    console.error('[getTeamMembers]', error);
    return [];
  }
}

/** Our Team：图集分类「Our Team」下的活动照片 */
export async function getTeamGallery(): Promise<TeamGalleryImage[]> {
  try {
    const albums = await getAlbums(['Our Team']);
    const album =
      albums.find((item) => item.name.trim().toLowerCase() === 'our team') ??
      albums[0];
    if (!album?.images?.length) return [];

    return album.images.map((img) => ({
      src: img.url,
      alt: img.alt || album.name,
    }));
  } catch (error) {
    console.error('[getTeamGallery]', error);
    return [];
  }
}

export type NewsItem = {
  id: number;
  title: string;
  description: string;
  cover: string;
  keywords: string;
  created_at: string;
  is_recommended: boolean;
};

export type NewsPageData = {
  featured: NewsItem[];
  articles: NewsItem[];
};

function productToNewsItem(item: {
  id: number;
  title: string;
  description: string;
  cover: string;
  keywords: string;
  created_at: string;
  is_recommended?: number;
}): NewsItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    cover: item.cover || '',
    keywords: item.keywords || '',
    created_at: item.created_at,
    is_recommended: Number(item.is_recommended) === 1,
  };
}

/** News & Events：推荐新闻 + 全部列表 */
export async function getNewsPageData(): Promise<NewsPageData> {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.news.categoryName,
    );
    if (!category) return { featured: [], articles: [] };

    const { list } = await getProducts(1, 100, category.id);
    const articles = [...list]
      .map(productToNewsItem)
      .sort(
        (a, b) =>
          new Date(b.created_at.replace(' ', 'T')).getTime() -
            new Date(a.created_at.replace(' ', 'T')).getTime() || b.id - a.id,
      );

    const featured = [...list]
      .filter((item) => Number(item.is_recommended) === 1)
      .sort((a, b) => a.id - b.id)
      .slice(0, 3)
      .map(productToNewsItem);

    return { featured, articles };
  } catch (error) {
    console.error('[getNewsPageData]', error);
    return { featured: [], articles: [] };
  }
}
