import type { Metadata } from 'next';
import { AboutBanner } from '@/components/about-banner';
import { getAboutSection, getTeamGallery, getTeamMembers } from '@/lib/about';
import { TeamContent } from './content';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutSection('team');
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function TeamPage() {
  const [{ banner }, members, gallery] = await Promise.all([
    getAboutSection('team'),
    getTeamMembers({ recommendedOnly: true }),
    getTeamGallery(),
  ]);

  return (
    <>
      <AboutBanner src={banner.image} poster={banner.poster} alt={banner.alt} />
      <TeamContent members={members} gallery={gallery} />
    </>
  );
}
