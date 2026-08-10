'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ABOUT_NAV } from '@/lib/history';

export function AboutNav() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = rootRef.current?.querySelector<HTMLElement>('.about-tab.is-active');
    active?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [pathname]);

  return (
    <aside ref={rootRef} className="about-tabs" aria-label="About sections">
      {ABOUT_NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
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
