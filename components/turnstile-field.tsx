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
  className?: string;
};

/**
 * 默认 interaction-only：多数情况完全不展示控件，
 * 仅当 Cloudflare 判定需要人机交互时才弹出挑战框。
 */
export function TurnstileField({ onToken, resetSignal = 0, className }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const reactId = useId();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;
    let cancelled = false;

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
          // 正常场景隐藏；仅可疑流量才显示挑战
          appearance: 'interaction-only',
          size: 'flexible',
          callback: (token) => {
            setVisible(false);
            onTokenRef.current(token);
          },
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => {
            setVisible(true);
            onTokenRef.current('');
          },
          'before-interactive-callback': () => setVisible(true),
          'after-interactive-callback': () => setVisible(true),
          'unsupported-callback': () => setVisible(true),
        });
      })
      .catch((err) => {
        console.error('[turnstile]', err);
        setVisible(true);
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
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current('');
    } catch {
      /* ignore */
    }
  }, [resetSignal]);

  if (!siteKey) return null;

  return (
    <div
      className={`${className || 'turnstile-field'}${visible ? ' is-visible' : ' is-invisible'}`}
      aria-hidden={!visible}
    >
      <div ref={hostRef} />
    </div>
  );
}
