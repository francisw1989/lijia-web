import type { FaqItem } from '@/lib/faq';

export type { FaqItem } from '@/lib/faq';

const CMS_API_URL = process.env.CMS_API_URL;

if (!CMS_API_URL) {
  console.warn('CMS_API_URL is not set');
}

async function cmsFetch<T>(path: string, tags: string[]): Promise<T> {
  const base = CMS_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  // 开发环境不缓存，避免本地改 CMS 后重启仍看到旧数据
  // （生产 CMS 的 revalidate 只会打到生产前台，清不了本机）
  const res = await fetch(
    `${base}${path}`,
    process.env.NODE_ENV === 'development'
      ? { cache: 'no-store' }
      : {
          // 静态缓存；CMS 变更时靠 /api/revalidate + revalidateTag 刷新
          next: { tags, revalidate: false },
        }
  );

  if (!res.ok) {
    throw new Error(`CMS request failed: ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export { cmsFetch };

export type ProductCategory = {
  id: number;
  name: string;
  parent_id: number | null;
  image: string;
  thumbnail: string;
  banner_type?: 'image' | 'video' | string;
  banner_cover?: string;
  subtitle: string;
  keywords: string;
  description: string;
  is_recommended: number;
  sort: number;
};

export type ProductListItem = {
  id: number;
  title: string;
  subtitle: string;
  category_id: number | null;
  cover: string;
  cover_type?: 'image' | 'video' | 'document' | string;
  /** 视频封面图（类型为 video 时） */
  video_cover?: string | null;
  /** 文件管理中的真实文件名（cover 对应 files.name） */
  cover_file_name?: string | null;
  keywords: string;
  description: string;
  is_recommended?: number;
  sort?: number;
  icon?: string;
  hover_icon?: string;
  use_custom_link?: number;
  custom_link?: string;
  created_at: string;
  updated_at: string;
  category_name: string | null;
};

export type Product = ProductListItem & {
  content: string;
  status: number;
};

export type ProductListResponse = {
  list: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getProductCategories() {
  return cmsFetch<ProductCategory[]>('/api/web/product-categories', [
    'product-categories',
    'products',
  ]);
}

export async function getProducts(
  page = 1,
  pageSize = 100,
  categoryId?: number,
  options?: { isRecommended?: boolean; fresh?: boolean },
) {
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (categoryId != null) qs.set('category_id', String(categoryId));
  if (options?.isRecommended != null) {
    qs.set('is_recommended', options.isRecommended ? '1' : '0');
  }
  if (options?.fresh) {
    const base = CMS_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const res = await fetch(`${base}/api/web/products?${qs}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`CMS request failed: /api/web/products (${res.status})`);
    }
    return res.json() as Promise<ProductListResponse>;
  }
  return cmsFetch<ProductListResponse>(`/api/web/products?${qs}`, ['products']);
}

export async function getProduct(id: number) {
  const base = CMS_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const res = await fetch(
    `${base}/api/web/products/${id}`,
    process.env.NODE_ENV === 'development'
      ? { cache: 'no-store' }
      : { next: { tags: ['products', `product-${id}`], revalidate: false } }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`CMS request failed: /api/web/products/${id} (${res.status})`);
  }

  return res.json() as Promise<Product>;
}

/** 文章列表：先按 sort 升序，再按次级比较函数 */
export function compareBySortThen<T extends { sort?: number | null; id: number }>(
  a: T,
  b: T,
  secondary: (x: T, y: T) => number,
) {
  const sortDiff = (Number(a.sort) || 0) - (Number(b.sort) || 0);
  if (sortDiff !== 0) return sortDiff;
  return secondary(a, b);
}

export type AlbumImage = {
  id: number;
  url: string;
  alt: string;
  sort: number;
};

export type Album = {
  id: number;
  name: string;
  sort: number;
  images: AlbumImage[];
};

/** 图集分类列表；names 可选，逗号分隔，如 Building,Environment */
export async function getAlbums(names?: string[]) {
  const qs =
    names?.length
      ? `?names=${encodeURIComponent(names.join(','))}`
      : '';
  return cmsFetch<Album[]>(`/api/web/albums${qs}`, ['albums']);
}

export async function getFaqs() {
  return cmsFetch<FaqItem[]>('/api/web/faqs', ['faqs']);
}

