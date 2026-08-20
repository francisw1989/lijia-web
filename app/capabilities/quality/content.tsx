'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { MarqueeTrack } from '@/components/marquee-track';
import { QC_PHASES, type QualityGalleryImage } from '@/lib/capabilities';

function MagnifierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function QualityContent({
  gallery,
}: {
  gallery: QualityGalleryImage[];
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const items = gallery;
  const preview =
    previewIndex !== null && items.length
      ? items[previewIndex % items.length]
      : null;

  useEffect(() => {
    if (previewIndex === null || !items.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((i) =>
          i === null ? i : (i - 1 + items.length) % items.length,
        );
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((i) => (i === null ? i : (i + 1) % items.length));
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [previewIndex, items.length]);

  return (
    <>
      <div className="container">
        <div className="qc-phases">
          {QC_PHASES.map((phase) => (
            <div key={phase.id} className="qc-phase">
              <Image src={phase.icon} alt={phase.label} width={332} height={180} />
              <p className="qc-phase-label">{phase.label}</p>
            </div>
          ))}
        </div>
      </div>

      {items.length ? (
        <section className="facilities-marquee-wrap" aria-label="Quality control gallery">
          <MarqueeTrack deps={[items.length]}>
            {[0, 1].map((copy) => (
              <div key={copy} className="facilities-marquee-group" aria-hidden={copy === 1}>
                {items.map((item, index) => (
                  <button
                    key={`${copy}-${item.src}-${index}`}
                    type="button"
                    className="facilities-marquee-item"
                    aria-label={`Preview ${item.alt}`}
                    tabIndex={copy === 1 ? -1 : undefined}
                    onClick={() => setPreviewIndex(index)}
                  >
                    <img src={item.src} alt={item.alt} />
                    <span className="facilities-marquee-zoom">
                      <MagnifierIcon />
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </MarqueeTrack>
        </section>
      ) : null}

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
                i === null ? i : (i - 1 + items.length) % items.length,
              );
            }}
          >
            <Image src="/images/9.png" alt="" width={40} height={40} />
          </button>
          <div className="img-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img src={preview.src} alt={preview.alt} className="img-lightbox-img" />
            <p className="img-lightbox-caption">{preview.alt}</p>
          </div>
          <button
            type="button"
            className="img-lightbox-nav img-lightbox-next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((i) => (i === null ? i : (i + 1) % items.length));
            }}
          >
            <Image src="/images/10.png" alt="" width={40} height={40} />
          </button>
        </div>
      ) : null}
    </>
  );
}
