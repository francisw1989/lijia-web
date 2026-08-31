'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { GalleryTile, imageTitle } from '@/components/gallery-img-hover';
import { MarqueeTrack } from '@/components/marquee-track';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import { QC_PHASES, type QualityGalleryImage } from '@/lib/capabilities';

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
              <Image
                src={phase.icon}
                alt={phase.label}
                width={332}
                height={180}
                unoptimized={isCmsAssetUrl(phase.icon)}
              />
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
                    <GalleryTile
                      key={`${copy}-${item.src}-${index}`}
                      src={item.src}
                      alt={item.alt}
                      className="facilities-marquee-item"
                      loading={copy === 0 ? 'eager' : 'lazy'}
                      tabIndex={copy === 1 ? -1 : undefined}
                      onClick={() => setPreviewIndex(index)}
                    />
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
            <p className="img-lightbox-caption">{imageTitle(preview.alt)}</p>
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
