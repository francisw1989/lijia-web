import { cache } from 'react';
import { getProductCategories, type ProductCategory } from '@/lib/cms';
import { categoryBannerCopy } from '@/lib/media';

export type ContactLocation = {
  id: string;
  label: string;
  phones: string[];
  emails: string[];
  apps: { label: string; value: string }[];
  address: string[];
  banner: string;
};

export const CONTACT_LOCATIONS: ContactLocation[] = [
  {
    id: 'ningbo',
    label: 'Ning Bo',
    phones: ['0086-574-88255396', '0086-574-88255396'],
    emails: ['info@lijiagames.com', 'tony@lijiagames.com'],
    apps: [
      { label: 'WeChat', value: 'chinastarningbo' },
      { label: 'Skype', value: 'tonynb5518' },
    ],
    address: [
      'A20-01, No.558, Middle Taikang Road,',
      'Yinzhou District, 315100,',
      'Ningbo, Zhejiang, China',
    ],
    banner: 'https://images.wangsanshui.com/images/1787540747987-c8wpex.png',
  },
  {
    id: 'jiangsu',
    label: 'Jiang Su',
    phones: ['0086-523-87654321', '0086-523-87654322'],
    emails: ['info@lijiagames.com', 'factory@lijiagames.com'],
    apps: [
      { label: 'WeChat', value: 'lijiagames' },
      { label: 'Skype', value: 'lijiafactory' },
    ],
    address: [
      'Lijia Game Production Co., Ltd.,',
      'Industrial Park,',
      'Taixing, Jiangsu,',
      'China 225400',
    ],
    banner: 'https://images.wangsanshui.com/images/1787298822505-cv3wb5.png',
  },
];

const CONTACT_NAME = 'Contact us';

export type ContactPageData = {
  meta: {
    title: string;
    description?: string;
    keywords?: string;
  };
  /** CMS 叠字；图片由 CONTACT_LOCATIONS.banner 提供 */
  banner: {
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
  return {
    meta: {
      title,
      description: category?.description?.trim() || undefined,
      keywords: category?.keywords?.trim() || undefined,
    },
    banner: {
      ...categoryBannerCopy(category),
      alt: category?.subtitle?.trim() || title,
    },
  };
}

/** Contact us：一级栏目 → metadata / banner 叠字；图片见 CONTACT_LOCATIONS */
export const getContactPageData = cache(async (): Promise<ContactPageData> => {
  try {
    const categories = await getProductCategories();
    return fromCategory(findContactCategory(categories));
  } catch (error) {
    console.error('[getContactPageData]', error);
    return fromCategory(null);
  }
});
export const CONTACT_HERO = CONTACT_LOCATIONS[0].banner;
