'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MahjongNavItem } from '@/lib/mahjong';
import { MAHJONG_BASE } from '@/lib/mahjong';

export function MahjongNav({ tabs }: { tabs: MahjongNavItem[] }) {
  const pathname = usePathname();

  if (!tabs.length) return null;

  return (
    <aside className="about-tabs mj-side-nav" aria-label="Mahjong categories">
      {tabs.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
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

export function MahjongBreadcrumb({
  tabs,
  current,
}: {
  tabs: MahjongNavItem[];
  /** 三级详情页当前文章标题 */
  current?: string;
}) {
  const pathname = usePathname();
  const activeTab =
    tabs.find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? tabs[0];

  return (
    <nav className="mj-breadcrumb" aria-label="Breadcrumb">
      <ol className="mj-breadcrumb-list">
        <li>
          <Link href="/manufacturing">Manufacturing</Link>
        </li>
        <li>
          <Link href={MAHJONG_BASE}>Mahjong</Link>
        </li>
        {activeTab ? (
          <li>
            {current ? (
              <Link href={activeTab.href}>{activeTab.label}</Link>
            ) : (
              <span aria-current="page">{activeTab.label}</span>
            )}
          </li>
        ) : null}
        {current ? (
          <li>
            <span aria-current="page">{current}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
