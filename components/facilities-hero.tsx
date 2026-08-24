import Link from 'next/link';
import { HeroMedia } from '@/components/hero-media';

const FACILITY_STATS = [
  {
    value: '15,840 m²',
    label: 'modern facilities',
    icon: 'https://images.wangsanshui.com/images/1787570475026-u91291.png',
  },
  {
    value: '200',
    label: 'Employees',
    icon: 'https://images.wangsanshui.com/images/1787570475031-qr473u.png',
  },
  {
    value: '10 million',
    label: 'units per year',
    icon: 'https://images.wangsanshui.com/images/1787570475020-40g22u.png',
  },
];

export function FacilitiesHero({
  src,
  poster,
  alt = 'Our Facilities',
  title,
  subtitle,
  learnMoreHref,
}: {
  src: string;
  poster?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  learnMoreHref?: string;
}) {
  if (!src) return null;

  const heading = title?.trim() || '';
  const lead = subtitle?.trim() || '';

  return (
    <section className="reveal about-hero facilities-hero container">
      <HeroMedia src={src} poster={poster} alt={alt} priority />
      <div className="facilities-hero-inner">
        {heading ? <h1 className="facilities-hero-title">{heading}</h1> : null}
        {lead ? <p className="facilities-hero-lead">{lead}</p> : null}

        <div className="facilities-hero-stats" aria-label="Facility highlights">
          {FACILITY_STATS.map((stat) => (
            <div key={stat.label} className="facilities-hero-stat">
              <div className="facilities-hero-stat-icon">
                <img src={stat.icon} alt="" aria-hidden="true" />
              </div>
              <div className="facilities-hero-stat-copy">
                <strong className="facilities-hero-stat-value">{stat.value}</strong>
                <span className="facilities-hero-stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {learnMoreHref ? (
          <Link href={learnMoreHref} className="facilities-hero-cta">
            Learn More
          </Link>
        ) : null}
      </div>
    </section>
  );
}
