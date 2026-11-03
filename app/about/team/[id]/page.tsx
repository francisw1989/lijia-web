import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { TeamBadge } from '@/components/team-badge';
import {
  getAboutSection,
  getTeamMemberByParam,
  getTeamMemberParams,
} from '@/lib/about';
import { isCmsAssetUrl } from '@/lib/cms-asset';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getTeamMemberParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getTeamMemberByParam(id);
  if (!data) return pageMetadata({ title: 'Team member not found' });
  return pageMetadata({
    title: data.member.name,
    description: data.member.description || undefined,
    keywords: data.member.keywords || undefined,
  });
}

export default async function TeamMemberDetailPage({ params }: Props) {
  const { id } = await params;
  const [{ banner, meta }, data] = await Promise.all([
    getAboutSection('team'),
    getTeamMemberByParam(id),
  ]);

  if (!data) notFound();
  if (id !== data.slug) permanentRedirect(`/about/team/${data.slug}`);

  const { member } = data;

  return (
    <>
      <AboutBanner src={banner.image} poster={banner.poster} alt={banner.alt} title={banner.title} subtitle={banner.subtitle} />
      <AboutShell>
        <article className="team-detail" suppressHydrationWarning>
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
            <div className="team-detail-body-wrap" suppressHydrationWarning>
              <h1 className="team-detail-title">{member.name}</h1>
              {member.role ? (
                <p className="team-detail-role">{member.role}</p>
              ) : null}
              <div
                className="team-detail-body"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                  __html: member.content || '',
                }}
              />
            </div>
          </div>
        </article>
      </AboutShell>
    </>
  );
}
