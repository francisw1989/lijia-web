'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

type CountUpProps = {
  value: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function CountUp({
  value,
  duration = 1400,
  className,
  style,
  children,
}: CountUpProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  // SSR / 爬虫读到真实终值，避免静态 HTML 里是 0
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();

        const start = performance.now();
        const from = 0;
        const to = value;

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(from + (to - from) * eased));
          if (t < 1) requestAnimationFrame(tick);
        };

        // 首帧起从 0 滚到终值；未开 JS 的爬虫仍保留 SSR 终值
        requestAnimationFrame(tick);
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <p ref={ref} className={className} style={style}>
      {display}
      {children}
    </p>
  );
}
