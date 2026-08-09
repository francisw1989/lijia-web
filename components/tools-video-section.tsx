'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { VideoModal } from '@/components/video-modal';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import type { ToolsVideoItem } from '@/lib/tools-static';

function IconPlay() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill="rgba(255,255,255,0.92)" />
      <path d="M18 14l14 8-14 8V14z" fill="var(--navy)" />
    </svg>
  );
}

function VideoThumb({
  item,
  className,
  onPlay,
}: {
  item: ToolsVideoItem;
  className: string;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={`Play ${item.title}`}
      onClick={onPlay}
    >
      {item.poster ? (
        <Image
          src={item.poster}
          alt={item.title}
          fill
          unoptimized={isCmsAssetUrl(item.poster)}
          className="object-cover"
          sizes="(max-width: 900px) 100vw, 50vw"
        />
      ) : (
        <span className="tools-video-fallback" />
      )}
      <span className="tools-video-play">
        <IconPlay />
      </span>
    </button>
  );
}

export function ToolsVideoSection({
  heading,
  videos,
  showViewMore = true,
}: {
  heading: string;
  videos: ToolsVideoItem[];
  showViewMore?: boolean;
}) {
  const [active, setActive] = useState<ToolsVideoItem | null>(null);
  const main = videos[0];
  const clips = videos.slice(1, 5);

  if (!videos.length) return null;

  return (
    <>
      <section className="section-pad" id="videos">
        <div className="container">
          <h2 className="tools-video-heading">{heading}</h2>
          <div className="tools-video-layout">
            {main ? (
              <VideoThumb
                item={main}
                className="tools-video-main tools-video-thumb"
                onPlay={() => setActive(main)}
              />
            ) : null}
            <div className="tools-video-grid">
              {clips.map((clip) => (
                <VideoThumb
                  key={clip.id}
                  item={clip}
                  className="tools-video-thumb"
                  onPlay={() => setActive(clip)}
                />
              ))}
            </div>
          </div>
          {showViewMore ? (
            <div className="flex-row-center mt36">
              <Link href="/tools/videos" className="btn btn-primary btn-pill">
                View More
                <Image src="/images/6.png" alt="" width={16} height={16} aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <VideoModal
        open={Boolean(active)}
        title={active?.title}
        src={active?.src || ''}
        poster={active?.poster}
        onClose={() => setActive(null)}
      />
    </>
  );
}

export function ToolsVideoGrid({ videos }: { videos: ToolsVideoItem[] }) {
  const [active, setActive] = useState<ToolsVideoItem | null>(null);

  return (
    <>
      <div className="tools-video-list-grid">
        {videos.map((item) => (
          <VideoThumb
            key={item.id}
            item={item}
            className="tools-video-thumb tools-video-list-card"
            onPlay={() => setActive(item)}
          />
        ))}
      </div>
      <VideoModal
        open={Boolean(active)}
        title={active?.title}
        src={active?.src || ''}
        poster={active?.poster}
        onClose={() => setActive(null)}
      />
    </>
  );
}
