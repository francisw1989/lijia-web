import type { Metadata } from 'next';
import { getHomepageSettings } from '@/lib/homepage';
import { absoluteUrl } from '@/lib/site';

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

/** 压平换行/去 HTML，并截到约 160 字符，避免 meta description 过长或带标签 */
export function clipMetaDescription(
  value: string | null | undefined,
  max = 160,
) {
  const flat = String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return undefined;
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  const base = (sp > 80 ? cut.slice(0, sp) : cut).trim();
  return `${base}…`;
}

function resolveTitleText(
  title: NonNullable<Metadata['title']>,
): string {
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object' && 'absolute' in title) {
    return String(title.absolute || '');
  }
  return '';
}

/**
 * 统一页面 metadata：
 * - title：页面名 · 首页标题（短 title 由运营在 CMS 改首页 SEO title）
 * - description：页面未填则用首页；统一截断
 * - canonical / openGraph / twitter：有 path 时输出
 * - 不再输出 meta keywords（对谷歌无效）
 */
export async function pageMetadata(opts: {
  title?: string | null;
  description?: string | null;
  /** @deprecated 前台不再输出 keywords；保留参数以免调用处报错 */
  keywords?: string | null;
  /** 规范路径，如 `/blog/foo`；传入后写 canonical + og:url */
  path?: string | null;
  /** 分享图（绝对或站点相对）；缺省用首页 banner */
  image?: string | null;
  type?: 'website' | 'article';
} = {}): Promise<Metadata> {
  const { seo, banner } = await getHomepageSettings();
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

  const titleText = resolveTitleText(title);
  const description = clipMetaDescription(
    pickSeoText(opts.description, seo.description, { rejectSlug: true }),
  );
  const path = String(opts.path || '').trim() || undefined;
  const canonical = path ? absoluteUrl(path === '/' ? '/' : path) : undefined;
  const rawImage =
    String(opts.image || '').trim() ||
    banner.imageUrl ||
    '/images/logo.png';
  const image = /^https?:\/\//i.test(rawImage)
    ? rawImage
    : absoluteUrl(rawImage.startsWith('/') ? rawImage : `/${rawImage}`);

  const meta: Metadata = {
    title,
    description,
    ...(canonical
      ? {
          alternates: { canonical },
          openGraph: {
            type: opts.type || 'website',
            locale: 'en_US',
            url: canonical,
            siteName: site,
            title: titleText,
            description,
            images: [{ url: image, alt: titleText }],
          },
          twitter: {
            card: 'summary_large_image',
            title: titleText,
            description,
            images: [image],
          },
        }
      : {
          openGraph: {
            type: opts.type || 'website',
            locale: 'en_US',
            siteName: site,
            title: titleText,
            description,
            images: [{ url: image, alt: titleText }],
          },
          twitter: {
            card: 'summary_large_image',
            title: titleText,
            description,
            images: [image],
          },
        }),
  };

  return meta;
}

/** @deprecated 优先用 pageMetadata；保留给仅需 title 的兜底 */
export async function siteTitle(
  pageTitle?: string | null,
): Promise<NonNullable<Metadata['title']>> {
  const meta = await pageMetadata({ title: pageTitle });
  return meta.title as NonNullable<Metadata['title']>;
}
