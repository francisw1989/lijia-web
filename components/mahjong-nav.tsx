'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MahjongNavItem } from '@/lib/mahjong';

export function MahjongNav({ tabs }: { tabs: MahjongNavItem[] }) {
  const pathname = usePathname();

  if (!tabs.length) return null;

  return (
    <nav className="page-tabs" aria-label="Mahjong categories">
      {tabs.map((item) => {
        const active = pathname === item.href;
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
    </nav>
  );
}
