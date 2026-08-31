import type { Metadata } from 'next';
import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import { getTemplateGeneratorPageData } from '@/lib/tools';
import { TemplateGeneratorApp } from './generator-app';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getTemplateGeneratorPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function TemplateGeneratorPage() {
  const { meta } = await getTemplateGeneratorPageData();

  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      <section className="container tools-doc-page">
        <div className="tools-doc-back">
          <Link href="/tools" className="about-news-more">
            &lt; Back to Tools &amp; Resources
          </Link>
        </div>
        <h1 className="tools-doc-heading">{meta.title}</h1>
        <p className="tools-doc-intro tg-lead">
          Create a custom print-ready template. Enter millimetre dimensions,
          then download a PDF with cut, bleed and margin lines.
        </p>
        <TemplateGeneratorApp />
      </section>
    </main>
  );
}
