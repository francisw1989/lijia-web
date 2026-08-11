import {
  getProductCategories,
  getProducts,
  type ProductCategory,
  type ProductListItem,
} from '@/lib/cms';
import { categoryBannerMedia } from '@/lib/media';
import type { ToolsResourceCard, ToolsVideoItem } from '@/lib/tools-static';

export type { ToolsResourceCard, ToolsVideoItem } from '@/lib/tools-static';

const TOOLS_NAME = 'Tools & Resources';
const FALLBACK_BANNER = '/images/banner/1.jpg';
const FALLBACK_HERO_TEXT =
  "Here at Lijia, we're dedicated to improving the process of making games. We think the more we share our manufacturing knowledge and experience with you, the better your game will be.";

export type ToolsPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  banner: {
    image: string;
    poster?: string;
    alt: string;
    text: string;
  };
};

export type ToolsResourceSlug = 'terms' | 'safety' | 'dice';

export type ToolsDocItem = {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  updatedAt: string;
};

export const TOOLS_VIDEOS_HEADING =
  'Discover Tips, Manufacturing & Components';

export type ToolsDocPageData = {
  slug: ToolsResourceSlug;
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  /** 栏目副标题 */
  subtitle: string;
  icon: string;
  documents: ToolsDocItem[];
};

const RESOURCE_DEFS: {
  slug: ToolsResourceSlug;
  match: RegExp;
  title: string;
  icon: string;
  intro: string;
}[] = [
  {
    slug: 'terms',
    match: /^terms\s*of\s*sale$/i,
    title: 'Terms of sale',
    icon: '/images/t/1.png',
    intro:
      'Download LIJIA commercial terms and related guidelines for your game production program.',
  },
  {
    slug: 'safety',
    match: /^safety\s*standard$/i,
    title: 'Safety Standard',
    icon: '/images/t/2.png',
    intro:
      'Safety and compliance documents that help you understand expectations for materials, labeling and testing.',
  },
  {
    slug: 'dice',
    match: /^dice\s*templates/i,
    title: 'Dice Templates (.PDF)',
    icon: '/images/t/4.png',
    intro:
      'Download printable dice templates and artwork guides for custom dice production.',
  },
];

function findToolsCategory(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) =>
        item.parent_id == null &&
        /^(tools|tools\s*&\s*resources)$/i.test(item.name.trim()),
    ) ??
    categories.find(
      (item) => item.parent_id == null && /tools?/i.test(item.name),
    ) ??
    null
  );
}

function displayTitle(name?: string | null) {
  const raw = name?.trim();
  if (!raw) return TOOLS_NAME;
  if (/^tools$/i.test(raw)) return TOOLS_NAME;
  return raw;
}

function heroText(category: ProductCategory | null) {
  const desc = category?.description?.trim() || '';
  const title = displayTitle(category?.name);
  if (desc && desc.toLowerCase() !== title.toLowerCase() && desc.length > 20) {
    return desc;
  }
  return FALLBACK_HERO_TEXT;
}

function fromCategory(category: ProductCategory | null): ToolsPageData {
  const title = displayTitle(category?.name);
  return {
    meta: {
      title,
      description: category?.description?.trim() || undefined,
      keywords: category?.keywords?.trim() || undefined,
    },
    banner: {
      image: categoryBannerMedia(category).image || FALLBACK_BANNER,
      poster: categoryBannerMedia(category).poster,
      alt: category?.subtitle?.trim() || title,
      text: heroText(category),
    },
  };
}

/** R2 对象 key：时间戳-随机串.ext，不能当作下载文件名 */
function isHashedObjectName(name: string) {
  return /^\d{10,}-[a-z0-9]+\.[a-z0-9]+$/i.test(name);
}

function extensionFromUrl(url: string) {
  try {
    const last = decodeURIComponent(url.split('?')[0]?.split('/').pop() || '');
    const m = last.match(/(\.[a-z0-9]+)$/i);
    return m?.[1] || '';
  } catch {
    return '';
  }
}

function resolveDocFileName(item: ProductListItem) {
  const real = item.cover_file_name?.trim();
  if (real && !isHashedObjectName(real)) return real;

  const url = item.cover?.trim() || '';
  try {
    const last = decodeURIComponent(url.split('?')[0]?.split('/').pop() || '');
    if (last && /\.[a-z0-9]+$/i.test(last) && !isHashedObjectName(last)) {
      return last;
    }
  } catch {
    /* ignore */
  }

  const ext = extensionFromUrl(url);
  const title = item.title?.trim() || 'download';
  if (ext && !title.toLowerCase().endsWith(ext.toLowerCase())) {
    return `${title}${ext}`;
  }
  return title;
}

function mapDoc(item: ProductListItem): ToolsDocItem | null {
  const fileUrl = item.cover?.trim();
  if (!fileUrl) return null;
  return {
    id: item.id,
    title: item.title,
    description: item.description?.trim() || '',
    fileUrl,
    fileName: resolveDocFileName(item),
    updatedAt: item.updated_at || item.created_at,
  };
}

/** Tools：一级栏目 → metadata / banner */
export async function getToolsPageData(): Promise<ToolsPageData> {
  try {
    const categories = await getProductCategories();
    return fromCategory(findToolsCategory(categories));
  } catch (error) {
    console.error('[getToolsPageData]', error);
    return fromCategory(null);
  }
}

/** Tools 首页四个资源入口（含 FAQ 占位） */
export async function getToolsResourceCards(): Promise<ToolsResourceCard[]> {
  const fallback: ToolsResourceCard[] = [
    {
      id: 'terms',
      title: 'Terms of sale',
      href: '/tools/terms',
      icon: '/images/t/1.png',
    },
    {
      id: 'safety',
      title: 'Safety Standard',
      href: '/tools/safety',
      icon: '/images/t/2.png',
    },
    { id: 'faq', title: 'FAQ', href: '/tools/faq', icon: '/images/t/3.png' },
    {
      id: 'dice',
      title: 'Dice Templates (.PDF)',
      href: '/tools/dice',
      icon: '/images/t/4.png',
    },
  ];

  try {
    const categories = await getProductCategories();
    const root = findToolsCategory(categories);
    if (!root) return fallback;

    const children = categories.filter((c) => c.parent_id === root.id);
    return fallback.map((card) => {
      if (card.id === 'faq') {
        return { ...card, href: '/tools/faq' };
      }
      const def = RESOURCE_DEFS.find((d) => d.slug === card.id);
      if (!def) return card;
      const cat = children.find((c) => def.match.test(c.name.trim()));
      return {
        ...card,
        title: cat?.name?.trim() || def.title,
        href: `/tools/${def.slug}`,
        icon: def.icon,
      };
    });
  } catch (error) {
    console.error('[getToolsResourceCards]', error);
    return fallback;
  }
}

export function isToolsResourceSlug(value: string): value is ToolsResourceSlug {
  return RESOURCE_DEFS.some((d) => d.slug === value);
}

function mapVideo(item: ProductListItem): ToolsVideoItem | null {
  const src = item.cover?.trim();
  if (!src) return null;
  if (item.cover_type && item.cover_type !== 'video') return null;
  return {
    id: item.id,
    title: item.title,
    description: item.description?.trim() || '',
    src,
    poster: item.video_cover?.trim() || '',
  };
}

/** Tools 视频栏目：Discover Tips… */
export async function getToolsVideos(): Promise<{
  heading: string;
  videos: ToolsVideoItem[];
}> {
  try {
    const categories = await getProductCategories();
    const root = findToolsCategory(categories);
    const child =
      root &&
      categories.find(
        (c) =>
          c.parent_id === root.id &&
          /^discover\s*tips/i.test(c.name.trim()),
      );

    if (!child) {
      return { heading: TOOLS_VIDEOS_HEADING, videos: [] };
    }

    const { list } = await getProducts(1, 100, child.id, { fresh: true });
    const videos = list
      .map(mapVideo)
      .filter((x): x is ToolsVideoItem => Boolean(x));

    return {
      heading: child.name?.trim() || TOOLS_VIDEOS_HEADING,
      videos,
    };
  } catch (error) {
    console.error('[getToolsVideos]', error);
    return { heading: TOOLS_VIDEOS_HEADING, videos: [] };
  }
}

/** Tools 文档列表页 */
export async function getToolsDocPageData(
  slug: string,
): Promise<ToolsDocPageData | null> {
  if (!isToolsResourceSlug(slug)) return null;

  const def = RESOURCE_DEFS.find((d) => d.slug === slug)!;

  try {
    const categories = await getProductCategories();
    const root = findToolsCategory(categories);
    const child =
      root &&
      categories.find(
        (c) => c.parent_id === root.id && def.match.test(c.name.trim()),
      );

    const title = child?.name?.trim() || def.title;
    const subtitleRaw = child?.subtitle?.trim() || '';
    // 副标题若与栏目名相同视为未填写，回退本地文案
    const subtitle =
      subtitleRaw && subtitleRaw.toLowerCase() !== title.toLowerCase()
        ? subtitleRaw
        : def.intro;

    let documents: ToolsDocItem[] = [];
    if (child) {
      const { list } = await getProducts(1, 100, child.id, { fresh: true });
      documents = list
        .map(mapDoc)
        .filter((x): x is ToolsDocItem => Boolean(x));
    }

    return {
      slug,
      meta: {
        title,
        description: child?.description?.trim() || subtitle,
        keywords: child?.keywords?.trim() || title,
      },
      subtitle,
      icon: def.icon,
      documents,
    };
  } catch (error) {
    console.error('[getToolsDocPageData]', error);
    return {
      slug,
      meta: { title: def.title, description: def.intro },
      subtitle: def.intro,
      icon: def.icon,
      documents: [],
    };
  }
}

/** @deprecated 使用 getToolsPageData().banner */
export const TOOLS_HERO = {
  image: FALLBACK_BANNER,
  text: FALLBACK_HERO_TEXT,
};

export {
  SAMPLE_BOX,
  TOOLS_INTRO,
  TOOL_GENERATOR,
  TOOL_VIDEOS,
} from '@/lib/tools-static';
