'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ABOUT_NAV } from '@/lib/history';

export function AboutNav() {
  const pathname = usePathname();

  return (
    <aside className="about-tabs" aria-label="About sections">
      {ABOUT_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
