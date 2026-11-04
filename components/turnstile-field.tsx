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
      'before-interactive-callback'?: () => void;
      'after-interactive-callback'?: () => void;
      'unsupported-callback'?: () => void;
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
  /** 提交时仍无 token 时递增，强制露出验证框 */
  revealSignal?: number;
  className?: string;
};

/**
 * 默认 interaction-only：多数情况静默通过、不展示控件。
 * 仅 Cloudflare 要求交互、加载失败，或表单主动 reveal 时才显示。
 */
export function TurnstileField({
  onToken,
  resetSignal = 0,
  revealSignal = 0,
  className,
}: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const reactId = useId();
  const [visible, setVisible] = useState(false);
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
        setVisible(false);
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: 'light',
          appearance: 'interaction-only',
          size: 'flexible',
          callback: (token) => {
            setVisible(false);
            setLoadError('');
            onTokenRef.current(token);
          },
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => {
            setVisible(true);
            onTokenRef.current('');
            setLoadError('Security check failed to load. Please refresh and try again.');
          },
          'before-interactive-callback': () => setVisible(true),
          'after-interactive-callback': () => setVisible(true),
          'unsupported-callback': () => {
            setVisible(true);
            setLoadError('Security check is not supported in this browser.');
          },
        });
      })
      .catch((err) => {
        console.error('[turnstile]', err);
        setVisible(true);
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
      setVisible(false);
      setLoadError('');
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current('');
    } catch {
      /* ignore */
    }
  }, [resetSignal]);

  useEffect(() => {
    if (!revealSignal) return;
    setVisible(true);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* ignore */
      }
    }
  }, [revealSignal]);

  if (!siteKey) return null;

  return (
    <div
      className={`${className || 'turnstile-field'}${visible ? ' is-visible' : ' is-invisible'}`}
      aria-hidden={!visible}
    >
      <div ref={hostRef} />
      {loadError ? <p className="form-error">{loadError}</p> : null}
    </div>
  );
}
