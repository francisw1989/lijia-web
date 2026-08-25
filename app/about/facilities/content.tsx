'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AboutShell } from '@/components/about-shell';
import { MarqueeTrack } from '@/components/marquee-track';
import type { FacilityAlbumTab } from '@/lib/about';

/** 悬停标题去掉常见图片后缀，如 Premises 01.gif → Premises 01 */
function imageTitle(value: string) {
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

export function FacilitiesContent({ albums }: { albums: FacilityAlbumTab[] }) {
  /** 无图片的分类不展示 */
  const visibleAlbums = useMemo(
    () => albums.filter((item) => item.images?.length > 0),
    [albums],
  );

  const [tab, setTab] = useState(visibleAlbums[0]?.id ?? '');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!visibleAlbums.some((item) => item.id === tab)) {
      setTab(visibleAlbums[0]?.id ?? '');
    }
  }, [visibleAlbums, tab]);

  const active = visibleAlbums.find((item) => item.id === tab) ?? visibleAlbums[0];
  const images = active?.images ?? [];
  const preview = previewIndex !== null ? images[previewIndex % images.length] : null;

  useEffect(() => {
    setPreviewIndex(null);
  }, [tab]);

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
      <AboutShell>
        <div className="box1">
          <Image
            src="/images/12.png"
            className="box1-deco"
            alt=""
            width={851}
            height={320}
            aria-hidden
          />
          <Image
            src="/images/11.png"
            className="box1-photo"
            alt="Julia Wang, President & CEO"
            width={434}
            height={370}
          />
          <div className="box1-copy">
            <h2 className="font40 font-bold colfff">Julia Wang</h2>
            <p className="font14 font-medium colfff">President &amp; CEO</p>
            <p className="font16 font-medium colfff box1-lead">
              We are committed to ensuring maximum customer satisfaction by
              supplying one-stop-shop service under top tenet of &quot;Quality
              First, Clients Supreme, Credit Upmost&quot;.We warmly welcome new
              and old customers, internal and external clients to visit and
              supervise our facilities.
            </p>
          </div>
        </div>
      </AboutShell>

      {visibleAlbums.length ? (
        <div className="container facilities-tabs-wrap">
          <div className="page-tabs" role="tablist" aria-label="Facility categories">
            {visibleAlbums.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`facility-gallery-${item.id}`}
                id={`facility-tab-${item.id}`}
                className={`about-tab${tab === item.id ? ' is-active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 所有有图分类都输出到 HTML，非当前 Tab 用 hidden 隐藏，便于查看源代码 / SEO */}
      {visibleAlbums.map((album) => {
        const isActive = album.id === tab;
        return (
          <section
            key={album.id}
            id={`facility-gallery-${album.id}`}
            role="tabpanel"
            aria-labelledby={`facility-tab-${album.id}`}
            hidden={!isActive}
            className="facilities-marquee-wrap"
            aria-label={`${album.label} gallery`}
          >
            <MarqueeTrack deps={[album.id, album.images.length, isActive]}>
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="facilities-marquee-group"
                  aria-hidden={copy === 1 || !isActive}
                >
                  {album.images.map((item, index) => (
                    <button
                      key={`${album.id}-${copy}-${item.src}-${index}`}
                      type="button"
                      className="facilities-marquee-item"
                      aria-label={`Preview ${item.alt}`}
                      tabIndex={!isActive || copy === 1 ? -1 : undefined}
                      onClick={() => {
                        if (!isActive) return;
                        setPreviewIndex(index);
                      }}
                    >
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading={isActive && copy === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <span className="facilities-img-hover">
                        <MagnifierIcon />
                        {item.alt ? (
                          <span className="facilities-img-title">
                            {imageTitle(item.alt)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </MarqueeTrack>
          </section>
        );
      })}

      {active ? (
        <div className="container flex-row-center facilities-view-more">
          <Link
            href={`/about/facilities/gallery/${active.id}`}
            className="btn btn-primary btn-pill"
          >
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
            <img src={preview.src} alt={preview.alt} className="img-lightbox-img" />
            <p className="img-lightbox-caption">{imageTitle(preview.alt)}</p>
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
