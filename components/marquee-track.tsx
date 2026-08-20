'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

/**
 * 恒定线速度（px/s）。
 * 原先整圈固定 40s：约 4 张桌面大图（~2400px）≈ 60px/s。
 */
const MARQUEE_PX_PER_SEC = 60;

export function MarqueeTrack({
  children,
  className = 'facilities-marquee-track',
  /** 内容变化或从 hidden 切到可见时传入，触发重测 */
  deps = [],
}: {
  children: ReactNode;
  className?: string;
  deps?: readonly unknown[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [durationSec, setDurationSec] = useState(40);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const group = el.querySelector(
        '.facilities-marquee-group',
      ) as HTMLElement | null;
      const width = group?.offsetWidth || el.scrollWidth / 2;
      if (width <= 0) return;
      setDurationSec(Math.max(12, width / MARQUEE_PX_PER_SEC));
    };

    measure();
    const raf = window.requestAnimationFrame(measure);

    el.querySelectorAll('img').forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', measure, { once: true });
      }
    });

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const group = el.querySelector('.facilities-marquee-group');
    if (group) ro.observe(group);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 由调用方显式传入 deps
  }, deps);

  const style = {
    '--marquee-duration': `${durationSec}s`,
  } as CSSProperties;

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
