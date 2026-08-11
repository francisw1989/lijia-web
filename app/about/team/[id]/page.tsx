import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { TeamBadge } from '@/components/team-badge';
import {
  getAboutSection,
  getTeamMember,
  getTeamMembers,
} from '@/lib/about';
import { isCmsAssetUrl } from '@/lib/cms-asset';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  try {
    const members = await getTeamMembers();
    return members.map((item) => ({ id: String(item.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const member = await getTeamMember(Number(id));
  if (!member) return { title: 'Team member not found' };
  return {
    title: member.name,
    description: member.description || member.role || undefined,
    keywords: member.keywords || undefined,
  };
}

export default async function TeamMemberDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ banner, meta }, member] = await Promise.all([
    getAboutSection('team'),
    getTeamMember(Number(id)),
  ]);

  if (!member) notFound();

  return (
    <>
      <AboutBanner src={banner.image} poster={banner.poster} alt={banner.alt} title={banner.title} subtitle={banner.subtitle} />
      <AboutShell>
        <article className="team-detail">
          <Link href="/about/team/list" className="about-news-more">
            &lt; back to {meta.title || 'Our Team'}
          </Link>
          <div className="team-detail-layout">
            {member.image ? (
              <div className="team-detail-photo relative">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  unoptimized={isCmsAssetUrl(member.image)}
                  className="object-cover"
                  sizes="(max-width: 900px) 100vw, 360px"
                  priority
                />
                <div className="team-card-meta">
                  <TeamBadge name={member.name} role={member.role} />
                </div>
              </div>
            ) : null}
            <div className="team-detail-body-wrap">
              <h1 className="team-detail-title">{member.name}</h1>
              {member.role ? (
                <p className="team-detail-role">{member.role}</p>
              ) : null}
              <div
                className="team-detail-body"
                dangerouslySetInnerHTML={{
                  __html: member.content || '<p>No introduction yet.</p>',
                }}
              />
            </div>
          </div>
        </article>
      </AboutShell>
    </>
  );
}
