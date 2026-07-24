import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Lijia Web',
    template: '%s · Lijia Web',
  },
  description: '外贸官网 SSG 示例',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <header className="site-header">
            <Link href="/" className="brand">
              Lijia
            </Link>
            <nav className="nav">
              <Link href="/articles">文章</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
