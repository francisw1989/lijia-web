import type { Metadata } from 'next';
import { CapabilitiesNav } from '@/components/capabilities-nav';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
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
      <section className="about-hero container">
        {hero.image ? (
          <HeroMedia src={hero.image} poster={hero.poster} alt={hero.title} priority />
        ) : null}
        <HeroBannerCopy title={hero.title} subtitle={hero.subtitle} />
      </section>

      <div className="container page-tabs-wrap">
        <CapabilitiesNav />
      </div>

      <QualityContent gallery={gallery} />
    </>
  );
}
