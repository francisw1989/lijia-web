import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { FacilitiesHero } from '@/components/facilities-hero';
import {
  getAboutSection,
  getFacilitiesIntro,
  getFacilityAlbums,
} from '@/lib/about';
import { FacilitiesContent } from './content';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutSection('facilities');
  return pageMetadata({
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  });
}

export default async function FacilitiesPage() {
  const [{ banner }, albums, intro] = await Promise.all([
    getAboutSection('facilities'),
    getFacilityAlbums(),
    getFacilitiesIntro(),
  ]);

  return (
    <>
      <FacilitiesHero
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
      />
      <FacilitiesContent albums={albums} intro={intro} />
    </>
  );
}
