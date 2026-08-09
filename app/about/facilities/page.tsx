import type { Metadata } from 'next';
import { AboutBanner } from '@/components/about-banner';
import { getAboutSection, getFacilityAlbums } from '@/lib/about';
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
  const [{ banner }, albums] = await Promise.all([
    getAboutSection('facilities'),
    getFacilityAlbums(),
  ]);

  return (
    <>
      <AboutBanner src={banner.image} alt={banner.alt} />
      <FacilitiesContent albums={albums} />
    </>
  );
}
