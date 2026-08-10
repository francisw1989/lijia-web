'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AboutShell } from '@/components/about-shell';
import { TeamCards } from '@/components/team-cards';
import type { TeamGalleryImage, TeamMember } from '@/lib/about';

function MagnifierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TeamContent({
  members,
  gallery,
}: {
  members: TeamMember[];
  gallery: TeamGalleryImage[];
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const preview =
    previewIndex !== null && gallery.length
      ? gallery[previewIndex % gallery.length]
      : null;

  useEffect(() => {
    if (previewIndex === null || !gallery.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((i) =>
          i === null ? i : (i - 1 + gallery.length) % gallery.length,
        );
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((i) => (i === null ? i : (i + 1) % gallery.length));
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [previewIndex, gallery.length]);

  return (
    <>
      <AboutShell className="about-shell-team">
        <TeamCards members={members} />
        {members.length ? (
          <div className="flex-row-center mt36">
            <Link href="/about/team/list" className="btn btn-primary btn-pill">
              View More
              <Image
                src="/images/6.png"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
              />
            </Link>
          </div>
        ) : null}
      </AboutShell>

      {gallery.length ? (
        <section
          className="facilities-marquee-wrap"
          aria-label="Team activities"
        >
          <div className="facilities-marquee-track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="facilities-marquee-group"
                aria-hidden={copy === 1}
              >
                {gallery.map((item, index) => (
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
          </div>
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
                i === null ? i : (i - 1 + gallery.length) % gallery.length,
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
              setPreviewIndex((i) =>
                i === null ? i : (i + 1) % gallery.length,
              );
            }}
          >
            <Image src="/images/10.png" alt="" width={40} height={40} />
          </button>
        </div>
      ) : null}
    </>
  );
}
