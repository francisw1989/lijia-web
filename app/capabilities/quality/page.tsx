import type { Metadata } from 'next';
import { CapabilitiesNav } from '@/components/capabilities-nav';
import { HeroMedia } from '@/components/hero-media';
import { getQualityGallery, getQualityPageData } from '@/lib/capabilities';
import { QualityContent } from './content';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getQualityPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function QualityPage() {
  const [{ hero }, gallery] = await Promise.all([
    getQualityPageData(),
    getQualityGallery(),
  ]);

  return (
    <>
      <section className="about-hero">
        {hero.image ? (
          <HeroMedia src={hero.image} alt={hero.title} priority />
        ) : null}
        <h1 className="sr-only">{hero.title}</h1>
      </section>

      <div className="container page-tabs-wrap">
        <CapabilitiesNav />
      </div>

      <QualityContent gallery={gallery} />
    </>
  );
}
