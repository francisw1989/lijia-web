import type { MetadataRoute } from 'next';
import { getCommunityListPagePaths } from '@/lib/articles';
import { SITE_MAP_SECTIONS } from '@/lib/site-map';
import { absoluteUrl, getSiteUrl } from '@/lib/site';

function collectPaths() {
  const paths = new Set<string>();
  for (const section of SITE_MAP_SECTIONS) {
    if (section.href) paths.add(section.href);
    for (const link of section.links) paths.add(link.href);
  }
  return [...paths];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const paths = [...collectPaths(), ...(await getCommunityListPagePaths())];
  return paths.map((path) => ({
    url: path === '/' ? base : absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path.includes('/page/') ? 0.5 : path.startsWith('/tools') ? 0.8 : 0.7,
  }));
}
