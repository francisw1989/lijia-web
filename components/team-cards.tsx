import Image from 'next/image';
import Link from 'next/link';
import { TeamBadge } from '@/components/team-badge';
import type { TeamMember } from '@/lib/about';
import { isCmsAssetUrl } from '@/lib/cms-asset';

export function TeamCards({ members }: { members: TeamMember[] }) {
  if (!members.length) return null;

  return (
    <div className="team-grid">
      {members.map((member, index) => (
        <Link
          key={member.id}
          href={`/about/team/${member.id}`}
          className="team-card reveal"
          style={{ transitionDelay: `${Math.min(index, 7) * 70}ms` }}
        >
          <div className="team-card-photo relative">
            <Image
              src={member.image}
              alt={member.name}
              fill
              unoptimized={isCmsAssetUrl(member.image)}
              className="object-cover team-card-img"
              sizes="(max-width: 800px) 50vw, 20vw"
            />
            <div className="team-card-meta">
              <TeamBadge name={member.name} role={member.role} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
