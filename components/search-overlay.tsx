'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  groupSearchResults,
  searchSite,
  type SearchResult,
} from '@/lib/search';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchOverlay({ open, onClose }: Props) {
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchSite(q, { limit: 16 })
        .then((data) => {
          setResults(data.results);
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  const groups = useMemo(() => groupSearchResults(results), [results]);

  if (!open) return null;

  const goResult = (item: SearchResult) => {
    onClose();
    router.push(item.href);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (results[active]) {
      goResult(results[active]);
      return;
    }
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    }
  };

  let flatIndex = -1;

  return (
    <div className="search-overlay-backdrop" role="presentation" onClick={onClose}>
      <div
        className="search-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <form className="search-overlay-form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor={titleId}>
            Search site
          </label>
          <input
            id={titleId}
            ref={inputRef}
            className="search-overlay-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages, products, blog…"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search-overlay-kbd">ESC</kbd>
        </form>

        <div className="search-overlay-body">
          {!query.trim() ? (
            <p className="search-overlay-hint">
              Type to search the site. Press Enter for all results.
            </p>
          ) : loading ? (
            <p className="search-overlay-hint">Searching…</p>
          ) : results.length === 0 ? (
            <p className="search-overlay-hint">No results for “{query.trim()}”.</p>
          ) : (
            groups.map(({ group, items }) => (
              <div key={group} className="search-overlay-group">
                <h3 className="search-overlay-group-title">{group}</h3>
                <ul className="search-overlay-list">
                  {items.map((item) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    return (
                      <li key={`${item.type}-${item.href}-${item.id ?? item.title}`}>
                        <Link
                          href={item.href}
                          className={`search-overlay-item${index === active ? ' is-active' : ''}`}
                          onMouseEnter={() => setActive(index)}
                          onClick={onClose}
                        >
                          <span className="search-overlay-item-title">{item.title}</span>
                          {item.snippet ? (
                            <span className="search-overlay-item-snippet">{item.snippet}</span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {query.trim() ? (
          <div className="search-overlay-footer">
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              className="search-overlay-all"
              onClick={onClose}
            >
              View all results
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
