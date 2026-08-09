import Image from 'next/image';
import { isCmsAssetUrl } from '@/lib/cms-asset';

export function AboutBanner({
  src,
  alt = 'Lijia about us',
}: {
  src: string;
  alt?: string;
}) {
  if (!src) return null;

  return (
    <section className="reveal about-hero container">
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        priority
        unoptimized={isCmsAssetUrl(src)}
        className="object-cover"
        sizes="(max-width: 1400px) 100vw, 1400px"
      />
    </section>
  );
}
