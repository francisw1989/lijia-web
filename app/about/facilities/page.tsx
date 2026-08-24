import type { Metadata } from 'next';
import { FacilitiesHero } from '@/components/facilities-hero';
import {
  getAboutSection,
  getFacilitiesIntroArticle,
  getFacilityAlbums,
} from '@/lib/about';
import { FacilitiesContent } from './content';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutSection('facilities');
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function FacilitiesPage() {
  const [{ banner }, albums, intro] = await Promise.all([
    getAboutSection('facilities'),
    getFacilityAlbums(),
    getFacilitiesIntroArticle(),
  ]);

  return (
    <>
      <FacilitiesHero
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
        learnMoreHref={intro ? `/about/facilities/${intro.id}` : undefined}
      />
      <FacilitiesContent albums={albums} />
    </>
  );
}
