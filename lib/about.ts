import { cache } from 'react';
import {
  getAlbums,
  getProduct,
  getProductCategories,
  getProducts,
  compareBySortThen,
  type Album,
  type ProductCategory,
} from '@/lib/cms';
import { categoryBannerCopy, categoryBannerMedia } from '@/lib/media';
import {
  contentSlug,
  contentSlugMap,
  resolveContentParam,
  slugFromMap,
} from '@/lib/slug';

export type AboutSectionKey = 'history' | 'facilities' | 'team' | 'news';

export type AboutSectionData = {
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
  categoryId: number | null;
};

export type FacilityAlbumTab = {
  id: string;
  label: string;
  images: { src: string; alt: string }[];
};

/** Our Facilities 前台固定使用的四个图集分类名 */
export const FACILITY_ALBUM_NAMES = [
  'Premises',
  'Workshop',
  'Machinery',
  'Production',
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
    categoryName: 'Events',
    fallbackTitle: 'Events',
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

  // Events 等已从 About 拆出的一级栏目，按名称匹配（含历史别名）
  return (
    categories.find((item) => item.name === categoryName) ??
    (categoryName === 'Events'
      ? categories.find((item) => item.name === 'News & Events') ?? null
      : null)
  );
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
      ...categoryBannerMedia(category),
      ...categoryBannerCopy(category),
      alt: keywords || category?.subtitle?.trim() || title,
    },
    categoryId: category?.id ?? null,
  };
}

function albumsToTabs(albums: Album[]): FacilityAlbumTab[] {
  const withNames = albums.filter((album) => album.images?.length);
  const slugMap = contentSlugMap(
    withNames.map((album) => ({ id: album.id, title: album.name })),
  );
  return withNames.map((album) => ({
    id: slugFromMap(slugMap, album.id, album.name),
    label: album.name,
    images: album.images.map((img) => ({
      src: img.url,
      alt: img.alt || album.name,
    })),
  }));
}

/** 四个 About 子页：metadata / banner 来自对应二级栏目 */
export const getAboutSection = cache(async (
  key: AboutSectionKey,
): Promise<AboutSectionData> => {
  const conf = ABOUT_SECTIONS[key];
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(categories, conf.categoryName);
    return sectionFromCategory(key, category);
  } catch (error) {
    console.error(`[getAboutSection:${key}]`, error);
    return sectionFromCategory(key, null);
  }
});

/** Our Facilities：拉取指定图集分类，顺序沿用接口（album.sort / 图片 sort） */
export const getFacilityAlbums = cache(async (): Promise<FacilityAlbumTab[]> => {
  try {
    const albums = await getAlbums([...FACILITY_ALBUM_NAMES]);
    return albumsToTabs(albums);
  } catch (error) {
    console.error('[getFacilityAlbums]', error);
    return [];
  }
});

/** Our Facilities：单个图集（View More 全览页；param 为名称 slug，兼容旧数字 id） */
export async function getFacilityAlbum(
  id: string,
): Promise<FacilityAlbumTab | null> {
  try {
    const albums = await getAlbums([...FACILITY_ALBUM_NAMES]);
    const candidates = albums
      .filter((album) => album.images?.length)
      .map((album) => ({ id: album.id, title: album.name }));
    const resolved = resolveContentParam(candidates, id);
    if (!resolved) return null;
    const album = albums.find((item) => item.id === resolved.id);
    if (!album?.images?.length) return null;
    return {
      id: resolved.slug,
      label: album.name,
      images: album.images.map((img) => ({
        src: img.url,
        alt: img.alt || album.name,
      })),
    };
  } catch (error) {
    console.error('[getFacilityAlbum]', error);
    return null;
  }
}

export async function getFacilityAlbumParams(): Promise<{ id: string }[]> {
  try {
    const albums = await getFacilityAlbums();
    return albums.map((item) => ({ id: item.id }));
  } catch {
    return [];
  }
}

export type FacilitiesArticle = {
  id: number;
  title: string;
  description: string;
  keywords: string;
  content: string;
  cover: string;
  coverType: 'image' | 'video' | 'document' | string;
  videoCover: string;
};

/** Our Facilities 介绍文（标题匹配 Our Facilities） */
export async function getFacilitiesIntro(): Promise<FacilitiesArticle | null> {
  try {
    const id = await getFacilitiesIntroArticleId();
    if (!id) return null;
    return getFacilitiesArticle(id);
  } catch (error) {
    console.error('[getFacilitiesIntro]', error);
    return null;
  }
}

/** Our Facilities 栏目下标题为 Our Facilities 的介绍文 id（列表页 Learn More） */
export async function getFacilitiesIntroArticleId(): Promise<number | null> {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.facilities.categoryName,
    );
    if (!category) return null;

    const { list } = await getProducts(1, 50, category.id);
    const match = list.find(
      (item) =>
        item.category_id === category.id &&
        /^our\s*facilities$/i.test(item.title.trim()),
    );
    return match?.id ?? null;
  } catch (error) {
    console.error('[getFacilitiesIntroArticleId]', error);
    return null;
  }
}

/** Our Facilities 文章详情（校验归属栏目） */
export async function getFacilitiesArticle(
  id: number,
): Promise<FacilitiesArticle | null> {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.facilities.categoryName,
    );
    if (!category) return null;

    const product = await getProduct(id);
    if (!product || product.status !== 1 || product.category_id !== category.id) {
      return null;
    }

    return {
      id: product.id,
      title: product.title,
      description: product.description || '',
      keywords: product.keywords || '',
      content: product.content || '',
      cover: product.cover || '',
      coverType: product.cover_type || 'image',
      videoCover: product.video_cover?.trim() || '',
    };
  } catch (error) {
    console.error('[getFacilitiesArticle]', error);
    return null;
  }
}

export async function getFacilitiesArticleParams(): Promise<{ id: string }[]> {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.facilities.categoryName,
    );
    if (!category) return [];
    const { list } = await getProducts(1, 100, category.id);
    const map = contentSlugMap(list);
    return list.map((item) => ({
      id: slugFromMap(map, item.id, item.title),
    }));
  } catch {
    return [];
  }
}

export function facilitiesArticleHref(article: { id: number; title: string }) {
  return `/about/facilities/${contentSlug(article.title, article.id)}`;
}

export async function getFacilitiesArticleByParam(
  param: string,
): Promise<{ article: FacilitiesArticle; slug: string } | null> {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.facilities.categoryName,
    );
    if (!category) return null;
    const { list } = await getProducts(1, 100, category.id);
    const resolved = resolveContentParam(list, param);
    if (!resolved) return null;
    const article = await getFacilitiesArticle(resolved.id);
    if (!article) return null;
    return { article, slug: resolved.slug };
  } catch {
    return null;
  }
}

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  image: string;
  slug?: string;
};

export function teamMemberHref(member: { id: number; name: string; slug?: string }) {
  return `/about/team/${member.slug || contentSlug(member.name, member.id)}`;
}

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
export const getTeamMembers = cache(async (
  options?: { recommendedOnly?: boolean; limit?: number },
): Promise<TeamMember[]> => {
  try {
    const category = await getTeamCategory();
    if (!category) return [];

    const { list } = await getProducts(1, 100, category.id, {
      isRecommended: options?.recommendedOnly ? true : undefined,
    });
    const filtered = [...list]
      .filter((item) => item.cover)
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id));
    const slugMap = contentSlugMap(filtered);
    const members = filtered.map((item) => ({
      ...productToTeamMember(item),
      slug: slugFromMap(slugMap, item.id, item.title),
    }));
    const limit = options?.limit;
    return limit != null && limit > 0 ? members.slice(0, limit) : members;
  } catch (error) {
    console.error('[getTeamMembers]', error);
    return [];
  }
});

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
      slug: contentSlug(product.title, product.id),
      content: product.content || '',
      description: product.description || '',
      keywords: product.keywords || '',
    };
  } catch (error) {
    console.error('[getTeamMember]', error);
    return null;
  }
}

export async function getTeamMemberByParam(
  param: string,
): Promise<{ member: TeamMemberDetail; slug: string } | null> {
  try {
    const members = await getTeamMembers();
    const resolved = resolveContentParam(
      members.map((m) => ({ id: m.id, title: m.name })),
      param,
    );
    if (!resolved) return null;
    const member = await getTeamMember(resolved.id);
    if (!member) return null;
    return { member, slug: resolved.slug };
  } catch {
    return null;
  }
}

export async function getTeamMemberParams(): Promise<{ id: string }[]> {
  const members = await getTeamMembers();
  return members.map((m) => ({
    id: m.slug || contentSlug(m.name, m.id),
  }));
}

/** Our Team：图集分类「Our Team」下的活动照片 */
export const getTeamGallery = cache(async (): Promise<TeamGalleryImage[]> => {
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
});

export type NewsItem = {
  id: number;
  title: string;
  description: string;
  cover: string;
  keywords: string;
  created_at: string;
  is_recommended: boolean;
  sort: number;
  /** 详情页路径段（标题 slug） */
  slug?: string;
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

/** Events：推荐内容 + 全部列表 */
export const getNewsPageData = cache(async (): Promise<NewsPageData> => {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.news.categoryName,
    );
    if (!category) return { featured: [], articles: [] };

    const { list } = await getProducts(1, 100, category.id);
    const slugMap = contentSlugMap(list);
    const withSlug = (item: (typeof list)[number]) => ({
      ...productToNewsItem(item),
      slug: slugFromMap(slugMap, item.id, item.title),
    });

    const articles = [...list]
      .map(withSlug)
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
      .map(withSlug);

    return { featured, articles };
  } catch (error) {
    console.error('[getNewsPageData]', error);
    return { featured: [], articles: [] };
  }
});

export function eventHref(item: { id: number; title: string; slug?: string }) {
  return `/events/${item.slug || contentSlug(item.title, item.id)}`;
}

export async function getEventByParam(
  param: string,
): Promise<{ productId: number; slug: string } | null> {
  try {
    const { articles } = await getNewsPageData();
    const resolved = resolveContentParam(articles, param);
    if (!resolved) return null;
    return { productId: resolved.id, slug: resolved.slug };
  } catch {
    return null;
  }
}

export async function getEventParams(): Promise<{ id: string }[]> {
  try {
    const { articles } = await getNewsPageData();
    return articles.map((item) => ({
      id: item.slug || contentSlug(item.title, item.id),
    }));
  } catch {
    return [];
  }
}

/** 首页新闻轮播：只取最近 N 条，避免拉全量列表 */
export const getNewsCarouselItems = cache(async (limit = 12): Promise<NewsItem[]> => {
  try {
    const categories = await getProductCategories();
    const category = findAboutCategory(
      categories,
      ABOUT_SECTIONS.news.categoryName,
    );
    if (!category) return [];

    const { list } = await getProducts(1, limit, category.id);
    const slugMap = contentSlugMap(list);
    return [...list]
      .map((item) => ({
        ...productToNewsItem(item),
        slug: slugFromMap(slugMap, item.id, item.title),
      }))
      .sort((a, b) =>
        compareBySortThen(a, b, (x, y) => {
          const t =
            new Date(y.created_at.replace(' ', 'T')).getTime() -
            new Date(x.created_at.replace(' ', 'T')).getTime();
          return t || y.id - x.id;
        }),
      )
      .slice(0, limit);
  } catch (error) {
    console.error('[getNewsCarouselItems]', error);
    return [];
  }
});
