import { cache } from 'react';
import { cmsFetch } from '@/lib/cms';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from '@/lib/site';

export type HomepageSeo = {
  title: string;
  keywords: string;
  description: string;
};

export type HomepageBanner = {
  mediaType?: 'video' | 'image';
  videoUrl: string;
  /** Learn More 弹框播放的完整版视频；空则仍跳转 /manufacturing */
  fullVideoUrl: string;
  imageUrl: string;
  title: string;
  subtitle: string;
};

export type HomepagePresence = {
  imageUrl: string;
  title: string;
  subtitle: string;
};

export type HomepageSettings = {
  seo: HomepageSeo;
  banner: HomepageBanner;
  presence: HomepagePresence;
};

const FALLBACK: HomepageSettings = {
  seo: {
    title: SITE_NAME,
    keywords: SITE_KEYWORDS,
    description: SITE_DESCRIPTION,
  },
  banner: {
    mediaType: 'video',
    videoUrl: 'https://images.wangsanshui.com/files/1786359788618-81ayf4.mp4',
    fullVideoUrl: '',
    imageUrl: 'https://images.wangsanshui.com/images/1786360663993-bekn15.jpg',
    title: 'Your Safe, Compliant & Fun Game\nManufacturing Partner',
    subtitle:
      'We deliver full custom board game production from prototype to global shipment.',
  },
  presence: {
    imageUrl: 'https://images.wangsanshui.com/images/1786360344634-0rxn6o.jpg',
    title: 'Global Presence',
    subtitle: 'The world knows Lijia Manufacturing',
  },
};

function normalizeSeo(raw: Partial<HomepageSeo> | null | undefined): HomepageSeo {
  return {
    title: String(raw?.title || '').trim() || FALLBACK.seo.title,
    keywords: String(raw?.keywords || '').trim() || FALLBACK.seo.keywords,
    description: String(raw?.description || '').trim() || FALLBACK.seo.description,
  };
}

function normalizeBanner(raw: Partial<HomepageBanner> | null | undefined): HomepageBanner {
  const title = String(raw?.title || '').trim();
  const subtitle = String(raw?.subtitle || '').trim();
  const videoUrl = String(raw?.videoUrl || '').trim();
  const fullVideoUrl = String(raw?.fullVideoUrl || '').trim();
  const imageUrl = String(raw?.imageUrl || '').trim();

  return {
    mediaType: 'video',
    videoUrl: videoUrl || FALLBACK.banner.videoUrl,
    fullVideoUrl,
    imageUrl: imageUrl || FALLBACK.banner.imageUrl,
    title: title || FALLBACK.banner.title,
    subtitle: subtitle || FALLBACK.banner.subtitle,
  };
}

function normalizePresence(
  raw: Partial<HomepagePresence> | null | undefined
): HomepagePresence {
  return {
    imageUrl: String(raw?.imageUrl || '').trim() || FALLBACK.presence.imageUrl,
    title: String(raw?.title || '').trim() || FALLBACK.presence.title,
    subtitle: String(raw?.subtitle || '').trim() || FALLBACK.presence.subtitle,
  };
}

export const getHomepageSettings = cache(async (): Promise<HomepageSettings> => {
  try {
    const data = await cmsFetch<Partial<HomepageSettings>>('/api/web/homepage', [
      'homepage',
    ]);
    return {
      seo: normalizeSeo(data?.seo),
      banner: normalizeBanner(data?.banner),
      presence: normalizePresence(data?.presence),
    };
  } catch (error) {
    console.error('[getHomepageSettings]', error);
    return FALLBACK;
  }
});

export function titleLines(title: string): string[] {
  return String(title || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
