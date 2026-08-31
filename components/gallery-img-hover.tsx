/** 图集标题去掉常见图片后缀，如 Premises 01.gif → Premises 01 */
import Link from 'next/link';

export function imageTitle(value: string) {
  return value.replace(/\.(gif|jpe?g|png|webp|avif|bmp|svg|tiff?)$/i, '').trim();
}

function MagnifierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 悬停层：仅放大镜 */
export function GalleryImgHover() {
  return (
    <span className="facilities-img-hover">
      <MagnifierIcon />
    </span>
  );
}

export function GalleryLink({
  href,
  src,
  alt,
  className,
}: {
  href: string;
  src: string;
  alt: string;
  className?: string;
}) {
  const label = imageTitle(alt);
  return (
    <Link href={href} className={`gallery-tile gallery-tile-link${className ? ` ${className}` : ''}`}>
      <span className="gallery-tile-media">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} loading="lazy" decoding="async" />
        ) : (
          <span className="gallery-tile-fallback" />
        )}
      </span>
      {label ? <span className="gallery-tile-caption">{label}</span> : null}
    </Link>
  );
}

export function GalleryTile({
  src,
  alt,
  className,
  onClick,
  loading,
  tabIndex,
}: {
  src: string;
  alt: string;
  className: string;
  onClick: () => void;
  loading?: 'eager' | 'lazy';
  tabIndex?: number;
}) {
  const label = imageTitle(alt);
  return (
    <button
      type="button"
      className={`gallery-tile ${className}`}
      aria-label={`Preview ${alt}`}
      tabIndex={tabIndex}
      onClick={onClick}
    >
      <span className="gallery-tile-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={loading} decoding="async" />
        <GalleryImgHover />
      </span>
      {label ? <span className="gallery-tile-caption">{label}</span> : null}
    </button>
  );
}
