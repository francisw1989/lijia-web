import { cmsFetch } from '@/lib/cms';

export type HomepageBanner = {
  mediaType?: 'video' | 'image';
  videoUrl: string;
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
  banner: HomepageBanner;
  presence: HomepagePresence;
};

const FALLBACK: HomepageSettings = {
  banner: {
    mediaType: 'video',
    videoUrl: 'https://images.wangsanshui.com/files/1786359788618-81ayf4.mp4',
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

function normalizeBanner(raw: Partial<HomepageBanner> | null | undefined): HomepageBanner {
  const title = String(raw?.title || '').trim();
  const subtitle = String(raw?.subtitle || '').trim();
  const videoUrl = String(raw?.videoUrl || '').trim();
  const imageUrl = String(raw?.imageUrl || '').trim();

  return {
    mediaType: 'video',
    videoUrl: videoUrl || FALLBACK.banner.videoUrl,
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

export async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    const data = await cmsFetch<Partial<HomepageSettings>>('/api/web/homepage', [
      'homepage',
    ]);
    return {
      banner: normalizeBanner(data?.banner),
      presence: normalizePresence(data?.presence),
    };
  } catch (error) {
    console.error('[getHomepageSettings]', error);
    return FALLBACK;
  }
}

export function titleLines(title: string): string[] {
  return String(title || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
