import { cache } from 'react';
import { getProductCategories, type ProductCategory } from '@/lib/cms';
import { categoryBannerCopy, categoryBannerMedia } from '@/lib/media';

export type ContactLocation = {
  id: string;
  label: string;
  phones: string[];
  emails: string[];
  apps: { label: string; value: string }[];
  address: string[];
};

export const CONTACT_LOCATIONS: ContactLocation[] = [
  {
    id: 'jiangsu',
    label: 'Jiangsu Factory',
    phones: ['+86-574-88255396'],
    emails: ['info@lijiagames.com'],
    apps: [
      { label: 'WeChat', value: 'tonychinastar' },
      { label: 'WeChat', value: 'cnlilyzhang' },
      { label: 'WhatsApp', value: '+8613867892160' },
    ],
    address: [
      'Office Add: A20-01, No. 558, Middle Taikang Road, Yinzhou District, 315000 Ningbo, Zhejiang, China',
      'Factory Add: #186, Jiangping Road, Zhangqiao Town, Taixing City, Jiangsu 225451, China',
    ],
  },
];

export const CONTACT_JIANGSU =
  CONTACT_LOCATIONS.find((item) => item.id === 'jiangsu') ?? CONTACT_LOCATIONS[0];

const CONTACT_NAME = 'Contact us';

export const CONTACT_HERO =
  'https://images.wangsanshui.com/images/1787298822505-cv3wb5.png';

export type ContactPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  /** CMS 栏目 banner（图/视频 + 叠字） */
  banner: {
    image: string;
    poster?: string;
    alt: string;
    title?: string;
    subtitle?: string;
  };
};

function findContactCategory(categories: ProductCategory[]) {
  return (
    categories.find(
      (item) =>
        item.parent_id == null &&
        /^contact(\s*us)?$/i.test(item.name.trim()),
    ) ??
    categories.find(
      (item) => item.parent_id == null && /contact/i.test(item.name),
    ) ??
    null
  );
}

function displayTitle(name?: string | null) {
  const raw = name?.trim();
  if (!raw) return CONTACT_NAME;
  if (/^contact$/i.test(raw)) return CONTACT_NAME;
  return raw;
}

function fromCategory(category: ProductCategory | null): ContactPageData {
  const title = displayTitle(category?.name);
  const media = categoryBannerMedia(category);
  return {
    meta: {
      title,
      description: category?.description?.trim() || undefined,
      keywords: category?.keywords?.trim() || undefined,
    },
    banner: {
      image: media.image || CONTACT_HERO,
      poster: media.poster,
      ...categoryBannerCopy(category),
      alt: category?.subtitle?.trim() || title,
    },
  };
}

/** Contact us：一级栏目 → metadata / banner */
export const getContactPageData = cache(async (): Promise<ContactPageData> => {
  try {
    const categories = await getProductCategories();
    return fromCategory(findContactCategory(categories));
  } catch (error) {
    console.error('[getContactPageData]', error);
    return fromCategory(null);
  }
});

