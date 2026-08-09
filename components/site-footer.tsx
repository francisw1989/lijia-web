import Link from 'next/link';
import { Logo } from './logo';

const COLUMNS = [
  {
    title: 'Home',
    href: '/',
    links: [] as { href: string; label: string }[],
  },
  {
    title: 'Abouts us',
    href: '/about',
    links: [
      { href: '/about/team', label: 'Our team' },
      { href: '/about', label: 'Partners' },
    ],
  },
  {
    title: 'Certificates',
    href: '/certificates',
    links: [
      { href: '/certificates', label: 'Certificates' },
      { href: '/certificates', label: 'Secondary page title' },
      { href: '/certificates', label: 'Secondary page' },
      { href: '/certificates', label: 'Secondary' },
      { href: '/certificates', label: 'Certificates' },
      { href: '/certificates', label: 'Secondary page title' },
      { href: '/certificates', label: 'Secondary page' },
      { href: '/certificates', label: 'Secondary' },
    ],
  },
  {
    title: 'Capabilities',
    href: '/capabilities',
    links: [
      { href: '/capabilities/scope', label: 'Scope of capabilities' },
      { href: '/capabilities/quality', label: 'Quality Control' },
    ],
  },
  {
    title: 'Manufacturing',
    href: '/manufacturing',
    links: [
      { href: '/manufacturing', label: 'Manufacturing' },
      { href: '/manufacturing/mahjong', label: 'Mahjong' },
    ],
  },
  {
    title: 'Contact us',
    href: '/contact',
    links: [{ href: '/contact', label: 'Contact us' }],
  },
];

const SOCIAL = [
  {
    label: 'Youtube',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.96 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z" />
      </svg>
    ),
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav className="footer-nav" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div key={col.title} className="footer-col">
              <h3>
                <Link href={col.href}>{col.title}</Link>
              </h3>
              {col.links.length > 0 ? (
                <ul>
                  {col.links.map((link, index) => (
                    <li key={`${col.title}-${link.label}-${index}`}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="footer-brand">
          <Link href="/" className="inline-flex" aria-label="LIJIA GAME PRODUCTION">
            <Logo />
          </Link>
          <div className="footer-social" aria-label="Social">
            {SOCIAL.map((item) => (
              <a key={item.label} href={item.href} aria-label={item.label}>
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} Lijia Game Maker All rights reserved |{' '}
          <Link href="/capabilities">Services</Link> |{' '}
          <Link href="/about/team">our team</Link> | Need service? Please contact us{' '}
          <a href="mailto:info@lijia-games.com">info@lijia-games.com</a>
        </p>
      </div>
    </footer>
  );
}
