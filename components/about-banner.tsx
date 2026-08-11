import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';

export function AboutBanner({
  src,
  poster,
  alt = 'Lijia about us',
  title,
  subtitle,
}: {
  src: string;
  poster?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
}) {
  if (!src) return null;

  return (
    <section className="reveal about-hero container">
      <HeroMedia src={src} poster={poster} alt={alt} priority />
      <HeroBannerCopy title={title} subtitle={subtitle} />
    </section>
  );
}
