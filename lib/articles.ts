import { cache } from 'react';
import { cmsFetch } from '@/lib/cms';

export const COMMUNITY_PAGE_SIZE = 10;

export type ArticleComment = {
  id: number;
  article_id: number;
  user_id: number;
  content: string;
  status: number;
  is_recommended?: number;
  created_at: string;
  updated_at?: string;
  username?: string | null;
  email?: string | null;
};

export type ArticleListItem = {
  id: number;
  title: string;
  category_id: number | null;
  cover: string;
  keywords: string;
  description: string;
  is_recommended: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  author_user_id: number | null;
  author_username?: string | null;
  created_at: string;
  updated_at: string;
  category_name: string | null;
};

export type Article = ArticleListItem & {
  content: string;
  status: number;
  comments?: ArticleComment[];
  liked?: boolean;
};

export type ArticleListResponse = {
  list: ArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CommunityPageData = {
  articles: ArticleListItem[];
  recommended: ArticleListItem[];
  page: number;
  pageCount: number;
  total: number;
};

export async function getArticles(
  category: 'Blog' | 'Forum',
  options?: {
    page?: number;
    pageSize?: number;
    isRecommended?: boolean;
  },
): Promise<ArticleListResponse> {
  const qs = new URLSearchParams({
    category,
    page: String(options?.page ?? 1),
    pageSize: String(options?.pageSize ?? 50),
  });
  if (options?.isRecommended != null) {
    qs.set('is_recommended', options.isRecommended ? '1' : '0');
  }
  return cmsFetch<ArticleListResponse>(`/api/web/articles?${qs}`, [
    'articles',
    category.toLowerCase(),
  ]);
}

export const getArticle = cache(async (id: number): Promise<Article | null> => {
  const base = (process.env.CMS_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const res = await fetch(
    `${base}/api/web/articles/${id}`,
    process.env.NODE_ENV === 'development'
      ? { cache: 'no-store' }
      : { next: { tags: ['articles', `article-${id}`], revalidate: false } },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`CMS request failed: /api/web/articles/${id} (${res.status})`);
  }
  return res.json() as Promise<Article>;
});

function pageCountFromTotal(total: number, pageSize = COMMUNITY_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize) || 1);
}

async function getCommunityPageData(
  category: 'Blog' | 'Forum',
  page = 1,
): Promise<CommunityPageData> {
  const current = Math.max(1, Math.floor(page) || 1);
  const [paged, recommended] = await Promise.all([
    getArticles(category, { page: current, pageSize: COMMUNITY_PAGE_SIZE }),
    getArticles(category, { pageSize: 10, isRecommended: true }),
  ]);
  const total = paged.total;
  const pageCount = pageCountFromTotal(total);
  return {
    articles: paged.list,
    recommended: recommended.list,
    page: current,
    pageCount,
    total,
  };
}

export async function getBlogPageData(page = 1) {
  return getCommunityPageData('Blog', page);
}

export async function getForumPageData(page = 1) {
  return getCommunityPageData('Forum', page);
}

export async function getCommunityPageParams(
  category: 'Blog' | 'Forum',
): Promise<{ page: string }[]> {
  try {
    const { total } = await getArticles(category, { page: 1, pageSize: 1 });
    const pageCount = pageCountFromTotal(total);
    if (pageCount <= 1) return [];
    return Array.from({ length: pageCount - 1 }, (_, i) => ({
      page: String(i + 2),
    }));
  } catch {
    return [];
  }
}

export async function getAllArticleIds(
  category: 'Blog' | 'Forum',
): Promise<{ id: string }[]> {
  try {
    const ids: string[] = [];
    let page = 1;
    let pageCount = 1;
    const pageSize = 100;
    do {
      const res = await getArticles(category, { page, pageSize });
      ids.push(...res.list.map((item) => String(item.id)));
      pageCount = pageCountFromTotal(res.total, pageSize);
      page += 1;
    } while (page <= pageCount);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

/** Blog / Forum 第 2 页起的列表路径，供 sitemap 与 llms.txt 使用 */
export async function getCommunityListPagePaths(): Promise<string[]> {
  const [blog, forum] = await Promise.all([
    getCommunityPageParams('Blog'),
    getCommunityPageParams('Forum'),
  ]);
  return [
    ...blog.map((item) => `/blog/page/${item.page}`),
    ...forum.map((item) => `/forum/page/${item.page}`),
  ];
}

export function communityListHref(
  base: '/blog' | '/forum',
  page: number,
): string {
  return page <= 1 ? base : `${base}/page/${page}`;
}
