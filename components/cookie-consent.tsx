'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'lijia-cookie-consent';

type ConsentValue = 'accepted' | 'declined';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== 'accepted' && saved !== 'declined') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-live="polite">
      <div className="cookie-consent-inner container">
        <div className="cookie-consent-copy">
          <h2 id="cookie-consent-title" className="cookie-consent-title">
            Cookies &amp; Privacy
          </h2>
          <p className="cookie-consent-text">
            We use essential cookies to keep this site working. By continuing, you agree to our
            handling of information you submit through forms, as described in our privacy terms.
          </p>
          <p className="cookie-consent-links">
            <Link href="/tools/cookies-privacy">Cookies &amp; Privacy</Link>
          </p>
        </div>
        <div className="cookie-consent-actions">
          <button type="button" className="btn btn-primary btn-pill" onClick={() => save('accepted')}>
            I Accept
          </button>
          <button type="button" className="btn btn-pill cookie-consent-decline" onClick={() => save('declined')}>
            I Do Not Accept
          </button>
        </div>
      </div>
    </div>
  );
}
