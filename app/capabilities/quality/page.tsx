import type { Metadata } from 'next';
import Image from 'next/image';
import { CapabilitiesNav } from '@/components/capabilities-nav';
import { getQualityGallery, getQualityPageData } from '@/lib/capabilities';
import { isCmsAssetUrl } from '@/lib/cms-asset';
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
          <Image
            src={hero.image}
            alt={hero.title}
            fill
            priority
            unoptimized={isCmsAssetUrl(hero.image)}
            className="object-cover"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />
        ) : null}
        <div className="cap-hero-inner cap-hero-banner">
          <h1 className="cap-hero-title">{hero.title}</h1>
          {hero.subtitle ? (
            <p className="cap-hero-lead">{hero.subtitle}</p>
          ) : null}
        </div>
      </section>

      <div className="container page-tabs-wrap">
        <CapabilitiesNav />
      </div>

      <QualityContent gallery={gallery} />
    </>
  );
}
