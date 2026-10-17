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
      streetAddress: '#186, Jiangping Road',
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
