'use client';

import { useState } from 'react';
import type { FaqItem } from '@/lib/faq';

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
            {open ? (
              <div className="tools-faq-a">
                <p>{item.answer}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
