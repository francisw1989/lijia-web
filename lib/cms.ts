const CMS_API_URL = process.env.CMS_API_URL;

if (!CMS_API_URL) {
  console.warn('CMS_API_URL is not set');
}

export type ArticleListItem = {
  id: number;
  title: string;
  category_id: number | null;
  cover: string;
  keywords: string;
  description: string;
  created_at: string;
  updated_at: string;
  category_name: string | null;
};

export type Article = ArticleListItem & {
  content: string;
  status: number;
};

export type ArticleListResponse = {
  list: ArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
};

async function cmsFetch<T>(path: string, tags: string[]): Promise<T> {
  const base = CMS_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const res = await fetch(`${base}${path}`, {
    next: { tags },
  });

  if (!res.ok) {
    throw new Error(`CMS request failed: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function getArticles(page = 1, pageSize = 50) {
  return cmsFetch<ArticleListResponse>(
    `/api/web/articles?page=${page}&pageSize=${pageSize}`,
    ['articles']
  );
}

export async function getArticle(id: number) {
  const base = CMS_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const res = await fetch(`${base}/api/web/articles/${id}`, {
    next: { tags: ['articles', `article-${id}`] },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`CMS request failed: /api/web/articles/${id} (${res.status})`);
  }

  return res.json() as Promise<Article>;
}
