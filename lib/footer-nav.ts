import { getProductCategories } from '@/lib/cms';

export type FooterLink = {
  label: string;
  /** 未确定时可不传，页脚只显示文案不可点 */
  href?: string;
};

export type FooterColumn = {
  title: string;
  href?: string;
  links: FooterLink[];
};

export type FooterNavData = {
  slogan: string[];
  columns: FooterColumn[];
};

/** 从 Scope of capabilities 下按名称匹配二级栏目 */
async function scopeCategoryHrefByName(match: RegExp): Promise<string | undefined> {
  try {
    const categories = await getProductCategories();
    const root =
      categories.find(
        (item) =>
          item.parent_id == null &&
          /^scope\s*of\s*capabilities$/i.test(item.name.trim()),
      ) ?? null;
    if (!root) return undefined;
    const child = categories.find(
      (item) => item.parent_id === root.id && match.test(item.name.trim()),
    );
    return child ? `/capabilities/scope#${child.id}` : undefined;
  } catch (error) {
    console.error('[scopeCategoryHrefByName]', error);
    return undefined;
  }
}

/**
 * 底部导航（对齐客户「底部栏目重构」）：
 * 左口号 + About Us / Capabilities & Manufacturing / Support & Resources / Legal & Compliance
 */
export async function getFooterNavData(): Promise<FooterNavData> {
  const [prototypingHref, sourcingHref] = await Promise.all([
    scopeCategoryHrefByName(/^prototyp/i),
    scopeCategoryHrefByName(/^sourc/i),
  ]);

  return {
    slogan: [
      'For decades',
      'we only do one thing',
      'Game manufacturing',
    ],
    columns: [
      {
        title: 'About Us',
        href: '/about',
        links: [
          { label: 'Company Profile', href: '/about/history' },
          { label: 'Factory Tour', href: '/about/facilities' },
          { label: 'Certifications', href: '/certificates' },
          { label: 'Our Team', href: '/about/team' },
          { label: 'Our History', href: '/about/history' },
        ],
      },
      {
        title: 'Capabilities & Manufacturing',
        href: '/capabilities',
        links: [
          { label: 'Our Capabilities', href: '/capabilities/scope' },
          { label: 'Quality Control', href: '/capabilities/quality' },
          {
            label: 'Prototyping & Engineering',
            href: prototypingHref,
          },
          {
            label: 'Component Sourcing',
            href: sourcingHref,
          },
          { label: 'Game‑Ready Components', href: '/manufacturing' },
          { label: 'Mahjong', href: '/manufacturing/mahjong/mahjong-tiles' },
        ],
      },
      {
        title: 'Support & Resources',
        links: [
          { label: 'Contact Us', href: '/contact' },
          { label: 'Help center', href: '/tools' },
          { label: 'FAQ', href: '/tools/faq' },
        ],
      },
      {
        title: 'Legal & Compliance',
        links: [
          { label: 'Intellectual Property Protection', href: '/tools/ip-protection' },
          { label: 'Confidentiality & NDA', href: '/tools/confidentiality-nda' },
          { label: 'Factory & Product Compliance', href: '/tools/safety' },
          { label: 'Terms & Privacy', href: '/tools/terms' },
          { label: 'Cookies & Privacy', href: '/tools/cookies-privacy' },
        ],
      },
    ],
  };
}

/** @deprecated 使用 getFooterNavData */
export async function getFooterNavColumns(): Promise<FooterColumn[]> {
  const { columns } = await getFooterNavData();
  return columns;
}
