import { ConnectCta } from '@/components/connect-cta';
import { RevealInit } from '@/components/reveal-init';

export default function ManufacturingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-white min-h-page">
      <RevealInit />
      {children}
      <ConnectCta />
    </main>
  );
}
