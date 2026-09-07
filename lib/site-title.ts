import type { Metadata } from 'next';
import { getHomepageSettings } from '@/lib/homepage';

/** 路由用单段 slug（如 game-card），不当作 SEO 关键词 */
function isRouteSlugKeyword(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value.trim());
}

function pickSeoText(
  value: string | null | undefined,
  fallback: string,
  opts?: { rejectSlug?: boolean },
) {
  const text = String(value || '').trim();
  if (!text) return fallback.trim() || undefined;
  if (opts?.rejectSlug && isRouteSlugKeyword(text)) {
    return fallback.trim() || undefined;
  }
  return text;
}

/**
 * 统一页面 metadata：
 * - title：页面名 · 首页标题
 * - description / keywords：CMS 未填（或 keywords 仅为路由 slug）时沿用首页 SEO
 */
export async function pageMetadata(opts: {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
} = {}): Promise<Metadata> {
  const { seo } = await getHomepageSettings();
  const site = seo.title.trim() || 'LIJIA GAME';
  const page = String(opts.title || '').trim();

  let title: NonNullable<Metadata['title']>;
  if (!page || page === site) {
    title = { absolute: site };
  } else if (
    page.endsWith(` · ${site}`) ||
    page.endsWith(` | ${site}`) ||
    page.endsWith(` - ${site}`)
  ) {
    title = { absolute: page };
  } else {
    title = { absolute: `${page} · ${site}` };
  }

  return {
    title,
    description: pickSeoText(opts.description, seo.description),
    keywords: pickSeoText(opts.keywords, seo.keywords, { rejectSlug: true }),
  };
}

/** @deprecated 优先用 pageMetadata；保留给仅需 title 的兜底 */
export async function siteTitle(
  pageTitle?: string | null,
): Promise<NonNullable<Metadata['title']>> {
  const meta = await pageMetadata({ title: pageTitle });
  return meta.title as NonNullable<Metadata['title']>;
}
