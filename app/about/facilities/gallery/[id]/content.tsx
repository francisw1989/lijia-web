'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { FacilityAlbumTab } from '@/lib/about';

function MagnifierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FacilitiesGalleryGrid({ album }: { album: FacilityAlbumTab }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const images = album.images;
  const preview =
    previewIndex !== null ? images[previewIndex % images.length] : null;

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((i) =>
          i === null ? i : (i - 1 + images.length) % images.length,
        );
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((i) => (i === null ? i : (i + 1) % images.length));
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [previewIndex, images.length]);

  return (
    <>
      <div className="facilities-gallery-grid">
        {images.map((item, index) => (
          <button
            key={`${item.src}-${index}`}
            type="button"
            className="facilities-gallery-item"
            aria-label={`Preview ${item.alt}`}
            onClick={() => setPreviewIndex(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
            <span className="facilities-marquee-zoom">
              <MagnifierIcon />
            </span>
          </button>
        ))}
      </div>

      {preview ? (
        <div
          className="img-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={preview.alt}
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            className="img-lightbox-close"
            aria-label="Close preview"
            onClick={() => setPreviewIndex(null)}
          >
            ×
          </button>
          <button
            type="button"
            className="img-lightbox-nav img-lightbox-prev"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((i) =>
                i === null ? i : (i - 1 + images.length) % images.length,
              );
            }}
          >
            <Image src="/images/9.png" alt="" width={40} height={40} />
          </button>
          <div className="img-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.src} alt={preview.alt} className="img-lightbox-img" />
            <p className="img-lightbox-caption">{preview.alt}</p>
          </div>
          <button
            type="button"
            className="img-lightbox-nav img-lightbox-next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((i) => (i === null ? i : (i + 1) % images.length));
            }}
          >
            <Image src="/images/10.png" alt="" width={40} height={40} />
          </button>
        </div>
      ) : null}
    </>
  );
}
