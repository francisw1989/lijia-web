'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './logo';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About us' },
  { href: '/certificates', label: 'Certificates' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/manufacturing', label: 'Manufacturing' },
  { href: '/contact', label: 'Contact us' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="container h-full flex-row-middle flex-row-between gap-16">
        <Link href="/" className="inline-flex shrink-0 flex-row-middle" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className={`flex1 flex-row-between nav ${open ? 'is-open' : ''}`} aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-text={item.label}
                className={active ? 'is-active' : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-row-middle gap-12">
          <Link
            href="/start-a-project"
            className="btn btn-primary btn-sm"
            onClick={() => setOpen(false)}
          >
            Start A Project
          </Link>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
