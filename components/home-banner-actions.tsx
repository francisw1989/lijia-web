'use client';

import Link from 'next/link';
import { useState } from 'react';
import { VideoModal } from '@/components/video-modal';

type Props = {
  fullVideoUrl?: string;
  poster?: string;
};

export function HomeBannerActions({ fullVideoUrl, poster }: Props) {
  const [open, setOpen] = useState(false);
  const src = String(fullVideoUrl || '').trim();

  return (
    <>
      <div className="flex-row-center flex-wrap gap-24 hero-actions">
        {src ? (
          <button
            type="button"
            className="btn btn-light btn-lg btn-light-border"
            onClick={() => setOpen(true)}
          >
            Learn More
          </button>
        ) : (
          <Link href="/manufacturing" className="btn btn-light btn-lg btn-light-border">
            Learn More
          </Link>
        )}
        <Link href="/contact" className="btn btn-glass btn-lg">
          Talk to us
        </Link>
      </div>
      <VideoModal
        open={open}
        src={src}
        poster={poster}
        title="Learn More"
        onClose={() => setOpen(false)}
      />
    </>
  );
}
