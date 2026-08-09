'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import type { StoryNode } from '@/lib/history';
import 'swiper/css';

export function AboutStorySwiper({ nodes }: { nodes: StoryNode[] }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null);
      if (e.key === 'ArrowLeft') {
        setPreviewIndex((i) => (i === null ? i : (i - 1 + nodes.length) % nodes.length));
      }
      if (e.key === 'ArrowRight') {
        setPreviewIndex((i) => (i === null ? i : (i + 1) % nodes.length));
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [previewIndex, nodes.length]);

  const previewNode = previewIndex !== null ? nodes[previewIndex] : null;

  if (!nodes.length) return null;

  return (
    <>
      <div className="about-story">
        <Swiper
          modules={[Navigation]}
          className="about-timeline"
          slidesPerView={1}
          spaceBetween={0}
          grabCursor
          simulateTouch
          watchSlidesProgress
          loop={nodes.length > 3}
          breakpoints={{
            801: { slidesPerView: 2, spaceBetween: 0 },
            981: { slidesPerView: 3, spaceBetween: 0 },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {nodes.map((node, index) => (
            <SwiperSlide key={node.year}>
              <article
                className="about-node"
                style={{ animationDelay: `${Math.min(index, 4) * 0.08}s` }}
              >
                <div className="about-node-top">
                  <h2 className="about-year">{node.year}</h2>
                  <p className="about-node-text">
                    <strong>{node.title}</strong>
                    <br />
                  </p>
                  <p className="about-node-text">
                    {node.body ? <> {node.body}</> : null}
                  </p>
                </div>
                <div className="about-node-media relative">
                  <button
                    type="button"
                    className="about-node-media-btn"
                    aria-label={`Preview ${node.year}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(index);
                    }}
                  >
                    <Image
                      src={node.image}
                      alt={node.keywords || node.title || node.year}
                      fill
                      unoptimized={isCmsAssetUrl(node.image)}
                      className="object-cover"
                      sizes="(max-width: 800px) 90vw, 33vw"
                    />
                  </button>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="about-story-nav">
          <button
            type="button"
            className="news-nav-btn"
            aria-label="Previous milestone"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <Image src="/images/9.png" alt="" width={36} height={36} />
          </button>
          <button
            type="button"
            className="news-nav-btn"
            aria-label="Next milestone"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <Image src="/images/10.png" alt="" width={36} height={36} />
          </button>
        </div>
      </div>

      {previewNode ? (
        <div
          className="img-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewNode.year} preview`}
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
                i === null ? i : (i - 1 + nodes.length) % nodes.length,
              );
            }}
          >
            <Image src="/images/9.png" alt="" width={40} height={40} />
          </button>
          <div className="img-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewNode.image}
              alt={previewNode.keywords || previewNode.title || previewNode.year}
              className="img-lightbox-img"
            />
            <p className="img-lightbox-caption">
              <strong>{previewNode.year}</strong> · {previewNode.title}
            </p>
          </div>
          <button
            type="button"
            className="img-lightbox-nav img-lightbox-next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((i) => (i === null ? i : (i + 1) % nodes.length));
            }}
          >
            <Image src="/images/10.png" alt="" width={40} height={40} />
          </button>
        </div>
      ) : null}
    </>
  );
}
