import Image from 'next/image';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import { isVideoMediaUrl } from '@/lib/media';

/**
 * 栏目 banner：图片或视频，铺满父级（如 .about-hero）。
 * 视频可传 poster（封面图）。
 */
export function HeroMedia({
  src,
  alt = '',
  poster,
  priority = false,
  className = 'object-cover',
  mask = false,
}: {
  src: string;
  alt?: string;
  poster?: string;
  priority?: boolean;
  className?: string;
  mask?: boolean;
}) {
  if (!src) return null;

  if (isVideoMediaUrl(src)) {
    return (
      <span className="hero-media-fill" aria-hidden={!alt}>
        <video
          className={className}
          src={src}
          poster={poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden={alt ? undefined : true}
          aria-label={alt || undefined}
        />
        {mask ? <div className="mask mask-dark" /> : null}
      </span>
    );
  }

  return (
    <span className="hero-media-fill" aria-hidden={!alt}>
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={isCmsAssetUrl(src)}
        className={className}
        sizes="100vw"
      />
      {mask ? <div className="mask mask-dark" /> : null}
    </span>
  );
}
