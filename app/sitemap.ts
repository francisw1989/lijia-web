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
  allManufacturingCategoryPageParams,
  allManufacturingCategoryParams,
  allManufacturingProductParams,
} from '@/lib/manufacturing';
import { SITE_MAP_SECTIONS } from '@/lib/site-map';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import { getToolsVideoParams } from '@/lib/tools';

const LEGAL_PATHS = new Set(['/tools/terms', '/tools/cookies-privacy']);

function collectPaths() {
  const paths = new Set<string>();
  for (const section of SITE_MAP_SECTIONS) {
    if (section.href) paths.add(section.href);
    for (const link of section.links) paths.add(link.href);
  }
  return [...paths];
}

function sitemapPriority(path: string): number {
  if (path === '/') return 1;
  if (LEGAL_PATHS.has(path)) return 0.2;
  if (path.includes('/page/')) return 0.5;
  if (path.startsWith('/tools')) return 0.7;
  return 0.75;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [
    mfgCategories,
    mfgCategoryPages,
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
    allManufacturingCategoryPageParams(),
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
    ...mfgCategoryPages.map(
      (item) => `/manufacturing/${item.id}/page/${item.page}`,
    ),
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

  // 不写统一的 new Date() lastmod，避免全站同一时间戳的假信号
  return [...paths].map((path) => ({
    url: path === '/' ? base : absoluteUrl(path),
    changeFrequency:
      path === '/' ? 'daily' : LEGAL_PATHS.has(path) ? 'yearly' : 'weekly',
    priority: sitemapPriority(path),
  }));
}
