import { ConnectCta } from '@/components/connect-cta';
import { RevealInit } from '@/components/reveal-init';

export default function CapabilitiesLayout({
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
