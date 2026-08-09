'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CAPABILITIES_NAV } from '@/lib/capabilities';

export function CapabilitiesNav() {
  const pathname = usePathname();

  return (
    <nav className="page-tabs" aria-label="Capabilities sections">
      {CAPABILITIES_NAV.map((item) => {
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
    </nav>
  );
}
