import {
  absoluteUrl,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
} from '@/lib/site';
import { CONTACT_LOCATIONS } from '@/lib/contact';
import { plainTextFromHtml } from '@/lib/capabilities';
import type { FaqItem } from '@/lib/faq';

type SiteCopy = {
  name?: string;
  description?: string;
};

export function organizationSchema(copy: SiteCopy = {}) {
  const factory = CONTACT_LOCATIONS[0];
  const name = copy.name?.trim() || SITE_NAME;
  const description = copy.description?.trim() || SITE_DESCRIPTION;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    legalName: SITE_LEGAL_NAME,
    url: getSiteUrl(),
    description,
    email: factory?.emails[0] || 'info@lijiagames.com',
    telephone: factory?.phones[0],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '#186, Jiangping Road, Zhangqiao Town',
      addressLocality: 'Taixing',
      addressRegion: 'Jiangsu',
      postalCode: '225451',
      addressCountry: 'CN',
    },
    contactPoint: CONTACT_LOCATIONS.flatMap((loc) =>
      loc.emails.map((email) => ({
        '@type': 'ContactPoint',
        contactType: 'customer service',
        name: loc.label,
        email,
        telephone: loc.phones[0],
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Chinese'],
      })),
    ),
  };
}

export function websiteSchema(copy: SiteCopy = {}) {
  const name = copy.name?.trim() || SITE_NAME;
  const description = copy.description?.trim() || SITE_DESCRIPTION;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: getSiteUrl(),
    description,
    publisher: {
      '@type': 'Organization',
      name,
      url: getSiteUrl(),
    },
  };
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: plainTextFromHtml(item.answer) || item.answer,
      },
    })),
    url: absoluteUrl('/tools/faq'),
  };
}

type ProductSchemaInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  url: string;
  brandName?: string;
};

function absoluteImageUrl(value: string | null | undefined) {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return absoluteUrl(raw.startsWith('/') ? raw : `/${raw}`);
}

/** 制造 / 能力等产品详情：名称、图片、描述（无公开报价时不写 offers） */
export function productSchema(input: ProductSchemaInput) {
  const name = String(input.name || '').trim();
  const description =
    String(input.description || '').trim() ||
    undefined;
  const image = absoluteImageUrl(input.image);
  const brandName = String(input.brandName || SITE_NAME).trim() || SITE_NAME;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    url: absoluteUrl(input.url),
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    manufacturer: {
      '@type': 'Organization',
      name: SITE_LEGAL_NAME,
      url: getSiteUrl(),
    },
  };
}

type ArticleSchemaInput = {
  headline: string;
  description?: string | null;
  image?: string | null;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
};

function toIsoDate(value: string | null | undefined) {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/** Blog / Forum 文章详情 */
export function articleSchema(input: ArticleSchemaInput) {
  const headline = String(input.headline || '').trim();
  const description = String(input.description || '').trim() || undefined;
  const image = absoluteImageUrl(input.image);
  const datePublished = toIsoDate(input.datePublished);
  const dateModified = toIsoDate(input.dateModified) || datePublished;
  const authorName = String(input.authorName || '').trim() || SITE_NAME;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    mainEntityOfPage: absoluteUrl(input.url),
    url: absoluteUrl(input.url),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_LEGAL_NAME,
      url: getSiteUrl(),
    },
  };
}
