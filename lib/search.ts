import { SITE_MAP_SECTIONS } from '@/lib/site-map';
import {
  isMahjongCategory,
  manufacturingCategoryHref,
  manufacturingProductHref,
} from '@/lib/manufacturing';

export type SearchResultType = 'page' | 'product' | 'article' | 'faq' | 'category';

export type SearchResult = {
  type: SearchResultType;
  id?: number;
  title: string;
  snippet: string;
  href: string;
  group: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};

type CmsSearchHit = {
  type: 'product' | 'article' | 'faq' | 'category';
  id: number;
  title: string;
  snippet?: string;
  group?: string;
  category_id?: number | null;
  category_name?: string | null;
  root_category_name?: string;
  section_slug?: string;
  section_name?: string;
  parent_id?: number | null;
  use_custom_link?: number | boolean;
  custom_link?: string | null;
};

function rootKey(name?: string | null) {
  return String(name || '').toLowerCase();
}

function resolveProductHref(hit: CmsSearchHit): string {
  if (hit.use_custom_link && hit.custom_link?.trim()) {
    const link = hit.custom_link.trim();
    if (link.startsWith('/')) return link;
    try {
      const u = new URL(link);
      return u.pathname + u.search + u.hash;
    } catch {
      return link;
    }
  }

  const root = rootKey(hit.root_category_name);
  const section = {
    id: hit.category_id || hit.id,
    name: hit.section_name || hit.category_name || '',
    keywords: hit.section_slug || '',
  };

  if (/manufactur/.test(root)) {
    if (isMahjongCategory(section) || /mahjong/i.test(hit.section_slug || '')) {
      return manufacturingProductHref(
        { id: section.id, name: 'Mahjong', keywords: 'mahjong' },
        hit.id,
      );
    }
    return manufacturingProductHref(
      hit.section_slug || section,
      hit.id,
    );
  }
  if (/certificate/.test(root)) return `/certificates/${hit.id}`;
  if (/event/.test(root)) return `/events/${hit.id}`;
  if (/team/.test(root)) return `/about/team/${hit.id}`;
  if (/facilit/.test(root)) return `/about/facilities/${hit.id}`;
  if (/capabilit/.test(root)) {
    return `/capabilities/scope/${hit.category_id}/${hit.id}`;
  }
  if (/tools/.test(root)) return '/tools';
  return `/manufacturing`;
}

function resolveCategoryHref(hit: CmsSearchHit): string {
  const root = rootKey(hit.root_category_name || hit.category_name);
  if (/manufactur/.test(root)) {
    if (hit.parent_id == null) return '/manufacturing';
    return manufacturingCategoryHref({
      id: hit.id,
      name: hit.category_name || hit.title,
      keywords: hit.section_slug,
    });
  }
  if (/certificate/.test(root)) return '/certificates';
  if (/event/.test(root)) return '/events';
  if (/team/.test(root)) return '/about/team';
  if (/facilit/.test(root)) return '/about/facilities';
  // root 可能是 "Scope of capabilities" / "Capabilities"
  if (/capabilit/.test(root) || /scope\s*of\s*capabilit/.test(root)) {
    if (hit.parent_id == null) return '/capabilities/scope';
    return `/capabilities/scope#${hit.id}`;
  }
  if (/tools/.test(root)) return '/tools';
  return '/';
}

function resolveArticleHref(hit: CmsSearchHit): string {
  const isForum = /forum/i.test(hit.category_name || hit.group || '');
  return isForum ? `/forum/${hit.id}` : `/blog/${hit.id}`;
}

function mapCmsHit(hit: CmsSearchHit): SearchResult | null {
  if (!hit?.title) return null;
  let href = '';
  if (hit.type === 'product') href = resolveProductHref(hit);
  else if (hit.type === 'category') href = resolveCategoryHref(hit);
  else if (hit.type === 'article') href = resolveArticleHref(hit);
  else if (hit.type === 'faq') href = `/tools/faq#faq-${hit.id}`;
  else return null;

  return {
    type: hit.type,
    id: hit.id,
    title: hit.title,
    snippet: hit.snippet || '',
    href,
    group: hit.group || 'Results',
  };
}

/** 固定栏目/页面：对 SITE_MAP 做本地标题匹配 */
export function matchStaticPages(query: string, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: SearchResult[] = [];
  const seen = new Set<string>();

  for (const section of SITE_MAP_SECTIONS) {
    const candidates = [
      section.href
        ? { href: section.href, label: section.title, group: section.title }
        : null,
      ...section.links.map((l) => ({
        href: l.href,
        label: l.label,
        group: section.title,
      })),
    ].filter(Boolean) as { href: string; label: string; group: string }[];

    for (const item of candidates) {
      if (seen.has(item.href)) continue;
      const hay = `${item.label} ${item.group}`.toLowerCase();
      if (!hay.includes(q)) continue;
      seen.add(item.href);
      out.push({
        type: 'page',
        title: item.label,
        snippet: item.group,
        href: item.href,
        group: 'Pages',
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function mergeResults(staticHits: SearchResult[], cmsHits: SearchResult[], limit: number) {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const item of [...staticHits, ...cmsHits]) {
    const key = `${item.type}:${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}

export async function searchSite(
  query: string,
  options?: { limit?: number },
): Promise<SearchResponse> {
  const q = String(query || '').trim().slice(0, 80);
  const limit = Math.min(50, Math.max(1, options?.limit ?? 20));
  if (!q) return { query: '', results: [] };

  // /api/search 已完成映射 + 静态页兜底，勿再次 mapCmsHit（会丢掉 root/parent 导致 href 变成 /）
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { cache: 'no-store' },
    );
    if (res.ok) {
      const data = (await res.json()) as SearchResponse;
      return {
        query: data.query || q,
        results: Array.isArray(data.results) ? data.results.slice(0, limit) : [],
      };
    }
  } catch {
    /* fall through */
  }

  return { query: q, results: matchStaticPages(q, limit) };
}

/** 服务端（RSC / route）直连 CMS */
export async function searchSiteServer(
  query: string,
  options?: { limit?: number },
): Promise<SearchResponse> {
  const q = String(query || '').trim().slice(0, 80);
  const limit = Math.min(50, Math.max(1, options?.limit ?? 40));
  if (!q) return { query: '', results: [] };

  const staticHits = matchStaticPages(q, limit);
  const base = (process.env.CMS_API_URL || 'http://localhost:3000').replace(/\/$/, '');

  let cmsHits: SearchResult[] = [];
  try {
    const res = await fetch(
      `${base}/api/web/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { cache: 'no-store' },
    );
    if (res.ok) {
      const data = (await res.json()) as { results?: CmsSearchHit[] };
      cmsHits = (data.results || [])
        .map(mapCmsHit)
        .filter(Boolean) as SearchResult[];
    }
  } catch {
    /* ignore */
  }

  return {
    query: q,
    results: mergeResults(staticHits, cmsHits, limit),
  };
}

export function groupSearchResults(results: SearchResult[]) {
  const map = new Map<string, SearchResult[]>();
  for (const item of results) {
    const key = item.group || 'Results';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }));
}
