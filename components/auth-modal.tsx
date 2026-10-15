'use client';

import { useEffect, useId, useState } from 'react';
import {
  loginCommunity,
  registerCommunity,
  sendRegisterCode,
} from '@/lib/community-auth';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';

type Mode = 'login' | 'register';

type AuthModalProps = {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [account, setAccount] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError('');
      setPassword('');
      setCode('');
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!open) return null;

  const handleSendCode = async () => {
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email first');
      return;
    }
    setSendingCode(true);
    try {
      const data = await sendRegisterCode(trimmed);
      setCooldown(typeof data.cooldown === 'number' ? data.cooldown : 60);
    } catch (err) {
      const e = err as Error & { cooldown?: number };
      setError(e.message || 'Failed to send code');
      if (typeof e.cooldown === 'number' && e.cooldown > 0) {
        setCooldown(e.cooldown);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginCommunity({ account: account.trim(), password });
      } else {
        await registerCommunity({
          email: email.trim(),
          username: username.trim(),
          password,
          code: code.trim(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id={titleId} className="auth-modal-title">
          {mode === 'login' ? 'Login' : 'Sign up'}
        </h2>
        <form className="auth-modal-form" onSubmit={submit}>
          {mode === 'login' ? (
            <label className="auth-field">
              <span>Email / Username</span>
              <input
                value={account}
                onChange={(e) => {
                  clearNativeValidity(e);
                  setAccount(e.target.value);
                }}
                onInvalid={englishNativeInvalid}
                autoComplete="username"
                required
              />
            </label>
          ) : (
            <>
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setEmail(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                  autoComplete="email"
                  required
                />
              </label>
              <div className="auth-field">
                <span>Verification code</span>
                <div className="auth-code-row">
                  <input
                    value={code}
                    onChange={(e) => {
                      clearNativeValidity(e);
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
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
                    onClick={handleSendCode}
                    disabled={sendingCode || cooldown > 0}
                  >
                    {sendingCode
                      ? 'Sending…'
                      : cooldown > 0
                        ? `${cooldown}s`
                        : 'Send code'}
                  </button>
                </div>
              </div>
              <label className="auth-field">
                <span>Username</span>
                <input
                  value={username}
                  onChange={(e) => {
                    clearNativeValidity(e);
                    setUsername(e.target.value);
                  }}
                  onInvalid={englishNativeInvalid}
                  autoComplete="username"
                  required
                  minLength={2}
                />
              </label>
            </>
          )}
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                clearNativeValidity(e);
                setPassword(e.target.value);
              }}
              onInvalid={englishNativeInvalid}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />
          </label>
          {error ? <p className="auth-modal-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
        <p className="auth-modal-switch">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button type="button" onClick={() => setMode('register')}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
