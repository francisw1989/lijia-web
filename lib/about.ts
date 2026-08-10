import {
  getAlbums,
  getProduct,
  getProductCategories,
  getProducts,
  compareBySortThen,
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

export type TeamMemberDetail = TeamMember & {
  content: string;
  description: string;
  keywords: string;
};

export type TeamGalleryImage = {
  src: string;
  alt: string;
};

function productToTeamMember(item: {
  id: number;
  title: string;
  subtitle: string;
  cover: string;
}): TeamMember {
  return {
    id: item.id,
    name: item.title,
    role: item.subtitle || '',
    image: item.cover,
  };
}

async function getTeamCategory() {
  const categories = await getProductCategories();
  return findAboutCategory(categories, ABOUT_SECTIONS.team.categoryName);
}

/** Our Team：栏目下文章 → 成员卡片；recommendedOnly 时仅推荐 */
export async function getTeamMembers(
  options?: { recommendedOnly?: boolean },
): Promise<TeamMember[]> {
  try {
    const category = await getTeamCategory();
    if (!category) return [];

    const { list } = await getProducts(1, 100, category.id, {
      isRecommended: options?.recommendedOnly ? true : undefined,
    });
    return [...list]
      .filter((item) => item.cover)
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
      .map(productToTeamMember);
  } catch (error) {
    console.error('[getTeamMembers]', error);
    return [];
  }
}

/** Our Team：成员详情（校验归属 Our Team 栏目） */
export async function getTeamMember(
  id: number,
): Promise<TeamMemberDetail | null> {
  try {
    const category = await getTeamCategory();
    if (!category) return null;

    const product = await getProduct(id);
    if (!product || product.category_id !== category.id) return null;

    return {
      ...productToTeamMember(product),
      content: product.content || '',
      description: product.description || '',
      keywords: product.keywords || '',
    };
  } catch (error) {
    console.error('[getTeamMember]', error);
    return null;
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
  sort: number;
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
  sort?: number;
}): NewsItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    cover: item.cover || '',
    keywords: item.keywords || '',
    created_at: item.created_at,
    is_recommended: Number(item.is_recommended) === 1,
    sort: Number(item.sort) || 0,
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
      .sort((a, b) =>
        compareBySortThen(a, b, (x, y) => {
          const t =
            new Date(y.created_at.replace(' ', 'T')).getTime() -
            new Date(x.created_at.replace(' ', 'T')).getTime();
          return t || y.id - x.id;
        }),
      );

    const featured = [...list]
      .filter((item) => Number(item.is_recommended) === 1)
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
      .slice(0, 3)
      .map(productToNewsItem);

    return { featured, articles };
  } catch (error) {
    console.error('[getNewsPageData]', error);
    return { featured: [], articles: [] };
  }
}
