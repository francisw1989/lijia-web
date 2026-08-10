import type { Metadata } from 'next';
import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import { SITE_MAP_SECTIONS } from '@/lib/site-map';

export const metadata: Metadata = {
  title: 'Site Map',
  description: 'Browse all main pages and list pages on the Lijia website.',
};

export default function SiteMapPage() {
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="reveal container section-pad site-map-page">
        <h1 className="title text-center">Site Map</h1>
        <p className="lead">
          Find every main section and list page on this site.
        </p>
        <div className="site-map-grid">
          {SITE_MAP_SECTIONS.map((section) => (
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
