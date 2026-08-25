import type { Metadata } from 'next';
import { FacilitiesHero } from '@/components/facilities-hero';
import {
  getAboutSection,
  getFacilitiesIntroArticleId,
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
  const [{ banner }, albums, introId] = await Promise.all([
    getAboutSection('facilities'),
    getFacilityAlbums(),
    getFacilitiesIntroArticleId(),
  ]);

  return (
    <>
      <FacilitiesHero
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
        learnMoreHref={introId ? `/about/facilities/${introId}` : undefined}
      />
      <FacilitiesContent albums={albums} />
    </>
  );
}
