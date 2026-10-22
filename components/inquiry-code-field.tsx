'use client';

import { useEffect, useState } from 'react';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';
import { sendInquiryCode } from '@/lib/use-inquiry-code';

type Props = {
  email: string;
  code: string;
  onCodeChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
};

export function InquiryCodeField({
  email,
  code,
  onCodeChange,
  className = 'auth-field',
  inputClassName,
}: Props) {
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const onSend = async () => {
    setLocalError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError('Please enter your email first');
      return;
    }
    setSending(true);
    try {
      const data = await sendInquiryCode(trimmed);
      setCooldown(typeof data.cooldown === 'number' ? data.cooldown : 60);
    } catch (err) {
      const e = err as Error & { cooldown?: number };
      setLocalError(e.message || 'Failed to send code');
      if (typeof e.cooldown === 'number' && e.cooldown > 0) {
        setCooldown(e.cooldown);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={className}>
      <span>Verification code</span>
      <div className="auth-code-row">
        <input
          className={inputClassName}
          value={code}
          onChange={(e) => {
            clearNativeValidity(e);
            onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6));
          }}
          onInvalid={englishNativeInvalid}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          minLength={6}
          maxLength={6}
          placeholder="6-digit code"
        />
        <button
          type="button"
          className="auth-send-code"
          onClick={onSend}
          disabled={sending || cooldown > 0}
        >
          {sending ? 'Sending…' : cooldown > 0 ? `${cooldown}s` : 'Send code'}
        </button>
      </div>
      {localError ? <p className="inquiry-code-error">{localError}</p> : null}
    </div>
  );
}
