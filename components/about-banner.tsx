import { HeroMedia } from '@/components/hero-media';

export function AboutBanner({
  src,
  poster,
  alt = 'Lijia about us',
}: {
  src: string;
  poster?: string;
  alt?: string;
}) {
  if (!src) return null;

  return (
    <section className="reveal about-hero container">
      <HeroMedia src={src} poster={poster} alt={alt} priority />
    </section>
  );
}
