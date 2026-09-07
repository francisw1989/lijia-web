import type { Metadata } from 'next';
import { getHomepageSettings } from '@/lib/homepage';

/**
 * 统一页面 <title>：首页标题在前。
 * 使用 absolute，避免嵌套 layout 冲掉根模板。
 */
export async function siteTitle(
  pageTitle?: string | null,
): Promise<NonNullable<Metadata['title']>> {
  const { seo } = await getHomepageSettings();
  const site = seo.title.trim() || 'LIJIA GAME';
  const page = String(pageTitle || '').trim();

  if (!page || page === site) {
    return { absolute: site };
  }

  if (
    page.startsWith(`${site} · `) ||
    page.startsWith(`${site} | `) ||
    page.startsWith(`${site} - `)
  ) {
    return { absolute: page };
  }

  return { absolute: `${site} · ${page}` };
}
