'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import type { StoryNode } from '@/lib/history';

export function AboutStorySwiper({ nodes }: { nodes: StoryNode[] }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

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
      <div className="history-timeline">
        <p className="history-future">Future</p>
        <div className="history-line" aria-hidden="true" />
        <ol className="history-list">
          {nodes.map((node, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            return (
              <li
                key={`${node.year}-${index}`}
                className={`history-item history-item--${side}`}
              >
                <span
                  className={`history-dot${index === 0 ? ' is-current' : ''}`}
                  aria-hidden="true"
                />
                <article className="history-card">
                  <h2 className="history-year">{node.year}</h2>
                  {node.title ? <p className="history-title">{node.title}</p> : null}
                  {node.body ? <p className="history-body">{node.body}</p> : null}
                  {node.image ? (
                    <div className="history-media relative">
                      <button
                        type="button"
                        className="history-media-btn"
                        aria-label={`Preview ${node.year}`}
                        onClick={() => setPreviewIndex(index)}
                      >
                        <Image
                          src={node.image}
                          alt={node.keywords || node.title || node.year}
                          fill
                          unoptimized={isCmsAssetUrl(node.image)}
                          className="object-cover"
                          sizes="(max-width: 800px) 90vw, 36vw"
                        />
                      </button>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
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
              title={previewNode.title || previewNode.keywords || previewNode.year || undefined}
              className="img-lightbox-img"
            />
            <p className="img-lightbox-caption">
              <strong>{previewNode.year}</strong>
              {previewNode.title ? <> · {previewNode.title}</> : null}
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
