'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './logo';
import { AuthModal } from './auth-modal';
import { SearchOverlay } from './search-overlay';
import {
  clearCommunitySession,
  getCommunityUser,
  refreshCommunityMe,
  subscribeAuth,
  type CommunityUser,
} from '@/lib/community-auth';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About us' },
  { href: '/certificates', label: 'Certificates' },
  { href: '/capabilities/scope', label: 'Capabilities' },
  { href: '/manufacturing', label: 'Manufacturing' },
  {
    href: '/blog',
    label: 'Community',
    children: [
      { href: '/blog', label: 'Blog' },
      { href: '/forum', label: 'Forum' },
      { href: '/events', label: 'Events' },
    ],
  },
  { href: '/contact', label: 'Contact us' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKbd, setSearchKbd] = useState('⌘K');
  const [user, setUser] = useState<CommunityUser | null>(null);

  useEffect(() => {
    setUser(getCommunityUser());
    refreshCommunityMe().then(setUser).catch(() => setUser(null));
    return subscribeAuth(() => setUser(getCommunityUser()));
  }, []);

  useEffect(() => {
    setOpen(false);
    setCommunityOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    setSearchKbd(isMac ? '⌘K' : 'Ctrl+K');
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <header className="header">
        <div className="container h-full flex-row-middle flex-row-between gap-16">
          <Link href="/" className="inline-flex shrink-0 flex-row-middle" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className={`flex1 flex-row-between nav ${open ? 'is-open' : ''}`} aria-label="Primary">
            {NAV.map((item) => {
              if (item.children) {
                const childActive = item.children.some((c) => isActive(pathname, c.href));
                return (
                  <div
                    key={item.label}
                    className={`nav-dropdown ${communityOpen ? 'is-open' : ''} ${childActive ? 'is-active' : ''}`}
                    onMouseEnter={() => setCommunityOpen(true)}
                    onMouseLeave={() => setCommunityOpen(false)}
                  >
                    <button
                      type="button"
                      className={`nav-dropdown-trigger ${childActive ? 'is-active' : ''}`}
                      aria-expanded={communityOpen}
                      onClick={() => setCommunityOpen((v) => !v)}
                    >
                      <span className="nav-dropdown-label" data-text={item.label}>
                        {item.label}
                      </span>
                      <span className="nav-dropdown-caret" aria-hidden="true" />
                    </button>
                    <div className="nav-dropdown-menu">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          data-text={child.label}
                          className={isActive(pathname, child.href) ? 'is-active' : undefined}
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              const active = isActive(pathname, item.href);
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

          <div className="flex-row-middle gap-20 header-actions">
            <button
              type="button"
              className="header-search-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="header-search-label">Search</span>
              <kbd className="header-search-kbd">{searchKbd}</kbd>
            </button>
            {user ? (
              <div className="header-user">
                <span className="header-username">{user.username}</span>
                <button
                  type="button"
                  className="header-auth-link"
                  onClick={() => {
                    clearCommunitySession();
                    setUser(null);
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <button type="button" className="header-auth-link" onClick={() => openAuth('login')}>
                Login
              </button>
            )}
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
      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setUser(getCommunityUser())}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
