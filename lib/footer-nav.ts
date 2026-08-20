import { getProductCategories, getProducts, compareBySortThen } from '@/lib/cms';
import { ABOUT_NAV } from '@/lib/history';
import {
  manufacturingDetailHref,
  MFG_COMPONENTS,
} from '@/lib/manufacturing';

export type FooterLink = {
  href: string;
  label: string;
};

export type FooterColumn = {
  title: string;
  href: string;
  links: FooterLink[];
};

async function getManufacturingFooterLinks(limit = 8): Promise<FooterLink[]> {
  const fallback = MFG_COMPONENTS.slice(0, limit).map((item) => ({
    href: item.href,
    label: item.title,
  }));

  try {
    const categories = await getProductCategories();
    const root =
      categories.find(
        (item) => item.parent_id == null && item.name === 'Manufacturing',
      ) ??
      categories.find(
        (item) => item.parent_id == null && /manufacturing/i.test(item.name),
      );
    if (!root) return fallback;

    const { list } = await getProducts(1, 100, root.id);
    const links = list
      .slice()
      .sort((a, b) => compareBySortThen(a, b, (x, y) => x.id - y.id))
      .slice(0, limit)
      .map((item) => {
        const customHref =
          Number(item.use_custom_link) === 1
            ? item.custom_link?.trim() || ''
            : '';
        return {
          href: customHref || manufacturingDetailHref(item.id),
          label: item.title,
        };
      });

    return links.length ? links : fallback;
  } catch (error) {
    console.error('[getManufacturingFooterLinks]', error);
    return fallback;
  }
}

/** 底部导航：真实栏目/页面 + Manufacturing 前 8 个组件（带链接） */
export async function getFooterNavColumns(): Promise<FooterColumn[]> {
  const manufacturingLinks = await getManufacturingFooterLinks(8);

  return [
    {
      title: 'Home',
      href: '/',
      links: [{ href: '/site-map', label: 'Site Map' }],
    },
    {
      title: 'About us',
      href: '/about',
      links: ABOUT_NAV.map((item) => ({
        href: item.href,
        label: item.label,
      })),
    },
    {
      title: 'Certificates',
      href: '/certificates',
      links: [{ href: '/certificates', label: 'Certificates' }],
    },
    {
      title: 'Capabilities',
      href: '/capabilities',
      links: [
        { href: '/capabilities/scope', label: 'Scope of capabilities' },
        { href: '/capabilities/quality', label: 'Quality Control' },
      ],
    },
    {
      title: 'Manufacturing',
      href: '/manufacturing',
      links: manufacturingLinks,
    },
    {
      title: 'Tools',
      href: '/tools',
      links: [
        { href: '/tools/videos', label: 'Our video' },
        { href: '/tools/generator', label: 'Template Generator' },
        { href: '/tools/safety', label: 'Safety Standard' },
        { href: '/tools/terms', label: 'Terms of sale' },
        { href: '/tools/faq', label: 'FAQ' },
      ],
    },
    {
      title: 'Contact us',
      href: '/contact',
      links: [{ href: '/contact', label: 'Contact us' }],
    },
  ];
}
