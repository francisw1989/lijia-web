import type { Metadata } from 'next';
import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import { getCommunityListPagePaths } from '@/lib/articles';
import { SITE_MAP_SECTIONS, type SiteMapSection } from '@/lib/site-map';
import { pageMetadata } from '@/lib/site-title';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Site Map',
    description: 'Browse all main pages and list pages on the Lijia website.',
  });
}

function withListPages(sections: SiteMapSection[], listPages: string[]): SiteMapSection[] {
  if (!listPages.length) return sections;
  return sections.map((section) => {
    if (section.title !== 'Community') return section;
    return {
      ...section,
      links: [
        ...section.links,
        ...listPages.map((href) => {
          const page = href.split('/').pop();
          const label = href.startsWith('/blog') ? 'Blog' : 'Forum';
          return { href, label: `${label} · Page ${page}` };
        }),
      ],
    };
  });
}

export default async function SiteMapPage() {
  const sections = withListPages(SITE_MAP_SECTIONS, await getCommunityListPagePaths());
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="reveal container section-pad site-map-page">
        <h1 className="title text-center">Site Map</h1>
        <p className="lead">
          Find every main section and list page on this site.
        </p>
        <div className="site-map-grid">
          {sections.map((section) => (
            <div key={section.title} className="site-map-col">
              <h2>
                {section.href ? (
                  <Link href={section.href}>{section.title}</Link>
                ) : (
                  section.title
                )}
              </h2>
              <ul>
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
