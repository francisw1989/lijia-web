'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export type ManufacturingNavItem = {
  id: string;
  label: string;
  href: string;
};

export function ManufacturingNav({ items }: { items: ManufacturingNavItem[] }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia('(max-width: 800px)').matches) return;
    const active = rootRef.current?.querySelector<HTMLElement>('.about-tab.is-active');
    active?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }, [pathname]);

  if (!items.length) return null;

  return (
    <aside ref={rootRef} className="about-tabs" aria-label="Manufacturing categories">
      {items.map((item) => {
        const mahjong = item.href.startsWith('/manufacturing/mahjong');
        const active = mahjong
          ? pathname.startsWith('/manufacturing/mahjong')
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`about-tab${active ? ' is-active' : ''}`}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}

export function ManufacturingBreadcrumb({
  category,
  current,
}: {
  category: { label: string; href: string };
  /** 三级详情页当前文章标题 */
  current?: string;
}) {
  return (
    <nav className="mj-breadcrumb" aria-label="Breadcrumb">
      <ol className="mj-breadcrumb-list">
        <li>
          <Link href="/manufacturing">Manufacturing</Link>
        </li>
        <li>
          {current ? (
            <Link href={category.href}>{category.label}</Link>
          ) : (
            <span aria-current="page">{category.label}</span>
          )}
        </li>
        {current ? (
          <li>
            <span aria-current="page">{current}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
