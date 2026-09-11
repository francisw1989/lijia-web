import Link from 'next/link';

/** 首页 Banner CTA：Learn More → Our Facilities；Talk to us → Contact */
export function HomeBannerActions() {
  return (
    <div className="flex-row-center flex-wrap gap-24 hero-actions">
      <Link href="/about/facilities" className="btn btn-light btn-lg btn-light-border">
        Learn More
      </Link>
      <Link href="/contact" className="btn btn-glass btn-lg">
        Talk to us
      </Link>
    </div>
  );
}
