import { RevealInit } from '@/components/reveal-init';

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      {children}
    </main>
  );
}
