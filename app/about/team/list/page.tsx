import type { Metadata } from 'next';
import Link from 'next/link';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { TeamCards } from '@/components/team-cards';
import { getAboutSection, getTeamMembers } from '@/lib/about';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutSection('team');
  return {
    title: `${meta.title} | All Members`,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function TeamListPage() {
  const [{ banner, meta }, members] = await Promise.all([
    getAboutSection('team'),
    getTeamMembers(),
  ]);

  return (
    <>
      <AboutBanner src={banner.image} poster={banner.poster} alt={banner.alt} title={banner.title} subtitle={banner.subtitle} />
      <AboutShell className="about-shell-team">
        <Link href="/about/team" className="about-news-more">
          &lt; back to {meta.title || 'Our Team'}
        </Link>
        <TeamCards members={members} />
      </AboutShell>
    </>
  );
}
