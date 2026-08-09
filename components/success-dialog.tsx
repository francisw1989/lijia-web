'use client';

import { useEffect } from 'react';

type SuccessDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export function SuccessDialog({
  open,
  onClose,
  title = 'Thank you!',
  message = "We've received your message and will get back to you shortly.",
}: SuccessDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="success-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-dialog-title"
    >
      <button
        type="button"
        className="success-dialog-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="success-dialog-card">
        <div className="success-dialog-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle className="success-dialog-ring" cx="32" cy="32" r="30" />
            <path
              className="success-dialog-check"
              d="M18 33.5l9 9 19-20"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 id="success-dialog-title" className="success-dialog-title">
          {title}
        </h2>
        <p className="success-dialog-msg">{message}</p>
        <button type="button" className="btn btn-primary success-dialog-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
