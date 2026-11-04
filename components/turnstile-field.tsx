'use client';

import { useEffect, useId, useRef, useState } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      appearance?: 'always' | 'execute' | 'interaction-only';
      size?: 'normal' | 'flexible' | 'compact';
      execution?: 'render' | 'execute';
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')));
      if (window.turnstile) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type Props = {
  onToken: (token: string) => void;
  /** 提交成功或失败后递增，触发 widget reset */
  resetSignal?: number;
  className?: string;
};

/**
 * 始终展示 Cloudflare 控件，避免 interaction-only 静默失败时
 * 「无验证框却提示 Please complete the security check」。
 */
export function TurnstileField({ onToken, resetSignal = 0, className }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const reactId = useId();
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;
    let cancelled = false;
    setLoadError('');

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null;
        }
        hostRef.current.innerHTML = '';
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: 'light',
          appearance: 'always',
          size: 'flexible',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => {
            onTokenRef.current('');
            setLoadError('Security check failed to load. Please refresh and try again.');
          },
        });
      })
      .catch((err) => {
        console.error('[turnstile]', err);
        setLoadError(
          'Security check unavailable. Please disable ad blockers or try another network.',
        );
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, reactId]);

  useEffect(() => {
    if (!resetSignal || !widgetIdRef.current || !window.turnstile) return;
    try {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current('');
    } catch {
      /* ignore */
    }
  }, [resetSignal]);

  if (!siteKey) return null;

  return (
    <div className={`${className || 'turnstile-field'} is-visible`}>
      <div ref={hostRef} />
      {loadError ? <p className="form-error">{loadError}</p> : null}
    </div>
  );
}
