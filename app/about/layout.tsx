import type { Metadata } from 'next';
import { RevealInit } from '@/components/reveal-init';

export const metadata: Metadata = {
  title: 'About us',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      {children}
    </main>
  );
}
