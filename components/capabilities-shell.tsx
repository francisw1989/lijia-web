import { CapabilitiesNav } from '@/components/capabilities-nav';

/** Capabilities 子页共用：顶部 Tab + 内容区 */
export function CapabilitiesShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`cap-shell ${className}`.trim()}>
      <div className="container">
        <CapabilitiesNav />
        {children}
      </div>
    </section>
  );
}
