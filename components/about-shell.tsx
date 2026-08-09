import { AboutNav } from '@/components/about-nav';

/** About 子页共用：左侧菜单 + 右侧内容区 */
export function AboutShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-pad about-shell ${className}`.trim()}>
      <div className="container about-layout">
        <AboutNav />
        <div className="about-panel">{children}</div>
      </div>
    </section>
  );
}
