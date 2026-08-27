export type SiteMapLink = {
  href: string;
  label: string;
};

export type SiteMapSection = {
  title: string;
  href?: string;
  links: SiteMapLink[];
};

/** 前台站点地图：一级页面 + 列表页（不含详情页） */
export const SITE_MAP_SECTIONS: SiteMapSection[] = [
  {
    title: 'Home',
    href: '/',
    links: [
      { href: '/', label: 'Home' },
      { href: '/site-map', label: 'Site Map' },
    ],
  },
  {
    title: 'About us',
    href: '/about',
    links: [
      { href: '/about/facilities', label: 'Our Facilities' },
      { href: '/about/history', label: 'Our Story & Philosophy' },
      { href: '/about/team', label: 'Our Team' },
      { href: '/about/team/list', label: 'Our Team — All Members' },
      { href: '/about/news', label: 'News & Events' },
    ],
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
    links: [
      { href: '/manufacturing', label: 'Manufacturing' },
      { href: '/manufacturing/mahjong/mahjong-tiles', label: 'Mahjong' },
    ],
  },
  {
    title: 'Tools',
    href: '/tools',
    links: [
      { href: '/tools', label: 'Tools' },
      { href: '/tools/videos', label: 'Our video' },
      { href: '/tools/generator', label: 'Template Generator' },
      { href: '/tools/safety', label: 'Safety Standard' },
      { href: '/tools/terms', label: 'Terms of sale' },
      { href: '/tools/ip-protection', label: 'Intellectual Property Protection' },
      { href: '/tools/confidentiality-nda', label: 'Confidentiality & NDA' },
      { href: '/tools/cookies-privacy', label: 'Cookies & Privacy' },
      { href: '/tools/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Start A Project',
    href: '/start-a-project',
    links: [{ href: '/start-a-project', label: 'Start A Project' }],
  },
  {
    title: 'Contact us',
    href: '/contact',
    links: [{ href: '/contact', label: 'Contact us' }],
  },
];
