import type { MetadataRoute } from 'next';
import { getCommunityListPagePaths } from '@/lib/articles';
import { allScopeProductParams } from '@/lib/capabilities';
import {
  allManufacturingCategoryParams,
  allManufacturingProductParams,
} from '@/lib/manufacturing';
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
  const [mfgCategories, mfgProducts, scopeProducts, communityPages] =
    await Promise.all([
      allManufacturingCategoryParams(),
      allManufacturingProductParams(),
      allScopeProductParams(),
      getCommunityListPagePaths(),
    ]);

  const paths = new Set<string>([
    ...collectPaths(),
    ...communityPages,
    ...mfgCategories.map((item) => `/manufacturing/${item.id}`),
    ...mfgProducts.map(
      (item) => `/manufacturing/${item.id}/${item.productId}`,
    ),
    ...scopeProducts.map(
      (item) => `/capabilities/scope/${item.categoryId}/${item.productId}`,
    ),
  ]);

  return [...paths].map((path) => ({
    url: path === '/' ? base : absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency:
      path === '/' ? 'daily' : path.includes('/page/') ? 'weekly' : 'weekly',
    priority:
      path === '/'
        ? 1
        : path.includes('/page/')
          ? 0.5
          : path.startsWith('/tools')
            ? 0.8
            : path.startsWith('/manufacturing/') ||
                path.startsWith('/capabilities/scope/')
              ? 0.75
              : 0.7,
  }));
}
