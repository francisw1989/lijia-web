import {
  absoluteUrl,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
} from '@/lib/site';
import { CONTACT_LOCATIONS } from '@/lib/contact';
import type { FaqItem } from '@/lib/faq';

export function organizationSchema() {
  const ningbo = CONTACT_LOCATIONS[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: SITE_LEGAL_NAME,
    url: getSiteUrl(),
    description: SITE_DESCRIPTION,
    email: ningbo?.emails[0] || 'info@lijiagames.com',
    telephone: ningbo?.phones[0],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A20-01, No.558, Middle Taikang Road, Yinzhou District',
      addressLocality: 'Ningbo',
      addressRegion: 'Zhejiang',
      postalCode: '315100',
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

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
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
        text: item.answer,
      },
    })),
    url: absoluteUrl('/tools/faq'),
  };
}
