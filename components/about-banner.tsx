import { HeroMedia } from '@/components/hero-media';

export function AboutBanner({
  src,
  alt = 'Lijia about us',
}: {
  src: string;
  alt?: string;
}) {
  if (!src) return null;

  return (
    <section className="reveal about-hero">
      <HeroMedia src={src} alt={alt} priority />
    </section>
  );
}
