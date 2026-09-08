'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  title?: string;
  src: string;
  poster?: string;
  onClose: () => void;
};

export function VideoModal({ open, title, src, poster, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !src || typeof document === 'undefined') return null;

  return createPortal(
    <div className="video-modal" role="dialog" aria-modal="true" aria-label={title || 'Video'}>
      <button
        type="button"
        className="video-modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="video-modal-panel">
        <button
          type="button"
          className="video-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="video-modal-frame">
          <video
            key={src}
            className="video-modal-player"
            src={src}
            poster={poster || undefined}
            controls
            autoPlay
            playsInline
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
