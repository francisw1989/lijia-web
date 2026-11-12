'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { InquiryCodeField } from '@/components/inquiry-code-field';
import { SuccessDialog } from '@/components/success-dialog';
import { TurnstileField } from '@/components/turnstile-field';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';
import { submitComplainMessage } from '@/lib/submit-message';
import { useCommunityFormPrefill } from '@/lib/use-community-form-prefill';
import { useInquiryAuth } from '@/lib/use-inquiry-code';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ComplainModal({ open, onClose }: Props) {
  const titleId = useId();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [turnstileReveal, setTurnstileReveal] = useState(0);
  const { name, setName, email, setEmail, resetToUser } =
    useCommunityFormPrefill();
  const { isLoggedIn } = useInquiryAuth();
  const needsTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSent(false);
    setCode('');
    setTurnstileToken('');
    setTurnstileReset((n) => n + 1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sent) onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, sent]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (needsTurnstile && !turnstileToken) {
      setTurnstileReveal((n) => n + 1);
      setError('Please complete the security check.');
      return;
    }
    if (!isLoggedIn && code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!message.trim()) {
      setError('Please describe your complaint.');
      return;
    }

    setSubmitting(true);
    const result = await submitComplainMessage({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      turnstileToken,
      ...(isLoggedIn ? {} : { code: code.trim() }),
    });
    setSubmitting(false);
    setCode('');

    if (!result.ok) {
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
      setError(result.message);
      return;
    }

    setTurnstileToken('');
    setMessage('');
    resetToUser();
    setSent(true);
  };

  const onSuccessClose = () => {
    setSent(false);
    setTurnstileReset((n) => n + 1);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {!sent ? (
        <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
          <div
            className="auth-modal complain-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="auth-modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
            <h2 id={titleId} className="auth-modal-title">
              Complain
            </h2>
            <form className="auth-modal-form" onSubmit={onSubmit}>
              <label className="auth-field">
                <span>Name*</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setName(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                />
              </label>
              <label className="auth-field">
                <span>Email*</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setEmail(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                />
              </label>
              {!isLoggedIn ? (
                <InquiryCodeField
                  email={email}
                  code={code}
                  onCodeChange={setCode}
                />
              ) : null}
              <label className="auth-field">
                <span>Complaint*</span>
                <textarea
                  required
                  rows={5}
                  value={message}
                  placeholder="Please describe your complaint"
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setMessage(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                />
              </label>
              <TurnstileField
                className="turnstile-field"
                onToken={setTurnstileToken}
                resetSignal={turnstileReset}
                revealSignal={turnstileReveal}
              />
              {error ? <p className="auth-modal-error">{error}</p> : null}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <SuccessDialog
        open={sent}
        onClose={onSuccessClose}
        title="Thank you!"
        message="We've received your complaint and will follow up shortly."
      />
    </>
  );
}
