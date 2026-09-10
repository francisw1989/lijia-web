'use client';

import { useState } from 'react';
import { hasRichContent } from '@/lib/capabilities';
import type { FaqItem } from '@/lib/faq';

function looksLikeHtml(value: string) {
  return /<[a-z][\s\S]*>/i.test(value);
}

function FaqAnswer({ answer }: { answer: string }) {
  const value = answer.trim();
  if (!value) return null;

  if (looksLikeHtml(value)) {
    if (!hasRichContent(value)) return null;
    return (
      <div
        className="tools-faq-a-body"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return value
    .split(/\n+/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, paraIndex) => <p key={paraIndex}>{para}</p>);
}

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null);

  return (
    <div className="tools-faq-list">
      {items.map((item, index) => {
        const open = openId === item.id;
        return (
          <article
            key={item.id}
            className={`tools-faq-item${open ? ' is-open' : ''}`}
          >
            <button
              type="button"
              className="tools-faq-q"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="tools-faq-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="tools-faq-question">{item.question}</span>
              <span className="tools-faq-toggle" aria-hidden="true" />
            </button>
            <div className="tools-faq-a" hidden={!open}>
              <FaqAnswer answer={item.answer} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
