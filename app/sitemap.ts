import type { MetadataRoute } from 'next';
import {
  getEventParams,
  getFacilitiesArticleParams,
  getFacilityAlbumParams,
  getTeamMemberParams,
} from '@/lib/about';
import {
  getCommunityArticlePaths,
  getCommunityListPagePaths,
} from '@/lib/articles';
import {
  allScopeProductParams,
  getQualityAlbumParams,
} from '@/lib/capabilities';
import { getCertificateArticleParams } from '@/lib/certificates';
import {
  allManufacturingCategoryParams,
  allManufacturingProductParams,
} from '@/lib/manufacturing';
import { SITE_MAP_SECTIONS } from '@/lib/site-map';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import { getToolsVideoParams } from '@/lib/tools';

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
  const [
    mfgCategories,
    mfgProducts,
    scopeProducts,
    communityPages,
    communityArticles,
    events,
    certificates,
    team,
    facilities,
    facilityAlbums,
    qualityAlbums,
    videos,
  ] = await Promise.all([
    allManufacturingCategoryParams(),
    allManufacturingProductParams(),
    allScopeProductParams(),
    getCommunityListPagePaths(),
    getCommunityArticlePaths(),
    getEventParams(),
    getCertificateArticleParams(),
    getTeamMemberParams(),
    getFacilitiesArticleParams(),
    getFacilityAlbumParams(),
    getQualityAlbumParams(),
    getToolsVideoParams(),
  ]);

  const paths = new Set<string>([
    ...collectPaths(),
    ...communityPages,
    ...communityArticles,
    ...mfgCategories.map((item) => `/manufacturing/${item.id}`),
    ...mfgProducts.map(
      (item) => `/manufacturing/${item.id}/${item.productId}`,
    ),
    ...scopeProducts.map(
      (item) => `/capabilities/scope/${item.categoryId}/${item.productId}`,
    ),
    ...events.map((item) => `/events/${item.id}`),
    ...certificates.map((item) => `/certificates/${item.id}`),
    ...team.map((item) => `/about/team/${item.id}`),
    ...facilities.map((item) => `/about/facilities/${item.id}`),
    ...facilityAlbums.map((item) => `/about/facilities/gallery/${item.id}`),
    ...qualityAlbums.map((item) => `/capabilities/quality/gallery/${item.id}`),
    ...videos.map((item) => `/tools/videos/${item.id}`),
  ]);

  return [...paths].map((path) => ({
    url: path === '/' ? base : absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority:
      path === '/'
        ? 1
        : path.includes('/page/')
          ? 0.5
          : path.startsWith('/tools')
            ? 0.8
            : 0.75,
  }));
}
