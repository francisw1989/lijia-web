'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { scopeTagHref, type ScopeItem } from '@/lib/capabilities';
import { isCmsAssetUrl } from '@/lib/cms-asset';

function categoryIdFromHash() {
  if (typeof window === 'undefined') return undefined;
  const raw = window.location.hash.replace(/^#/, '').trim();
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isFinite(id) ? id : undefined;
}

function indexForCategory(items: ScopeItem[], categoryId?: number) {
  if (categoryId == null) return 0;
  const found = items.findIndex((item) => item.id === categoryId);
  return found >= 0 ? found : 0;
}

export function ScopeContent({ items }: { items: ScopeItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const applyHash = () => {
      const categoryId = categoryIdFromHash();
      setIndex(indexForCategory(items, categoryId));
      if (categoryId != null) {
        document.getElementById('cap-scope-categories')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [items]);

  if (items.length === 0) {
    return <p className="empty">No capability categories published yet.</p>;
  }

  const active = items[Math.min(index, items.length - 1)];

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + items.length) % items.length);
  };

  return (
    <>
      <div
        id="cap-scope-categories"
        className="cap-icons"
        role="tablist"
        aria-label="Capability categories"
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`cap-icon${i === index ? ' is-active' : ''}`}
            onClick={() => setIndex(i)}
          >
            <span className="cap-icon-media">
              <Image
                src={item.icon}
                alt={item.title}
                width={120}
                height={120}
                unoptimized={isCmsAssetUrl(item.icon)}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="cap-detail">
        <button
          type="button"
          className="cap-detail-nav cap-detail-prev"
          aria-label="Previous capability"
          onClick={() => go(-1)}
        >
          <Image src="/images/9.png" alt="" width={40} height={40} />
        </button>

        <div className="cap-detail-body">
          <div className="cap-detail-copy">
            <h2 className="font40 font-bold">{active.title}</h2>
            {active.subtitle ? (
              <p className="font16 col-muted mt12">{active.subtitle}</p>
            ) : null}
            <div className="cap-tags">
              {active.tags.map((item) => (
                <Link
                  key={item.id}
                  href={scopeTagHref(active.id, item.id)}
                  className="cap-tag"
                >
                  {item.title}
                  <span className="cap-tag-chevron" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <div className="cap-detail-media">
            <Image
              src={active.image}
              alt={active.title}
              fill
              unoptimized={isCmsAssetUrl(active.image)}
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 480px"
            />
          </div>
        </div>

        <button
          type="button"
          className="cap-detail-nav cap-detail-next"
          aria-label="Next capability"
          onClick={() => go(1)}
        >
          <Image src="/images/10.png" alt="" width={40} height={40} />
        </button>
      </div>
    </>
  );
}
