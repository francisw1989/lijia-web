'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** 首次进入视口时为 `.reveal` 元素加上 `.is-in`（路由变化时重新绑定） */
export function RevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)'),
    );
    if (!nodes.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      nodes.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);
          // 先保证首帧是隐藏态，再触发出现动画
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.classList.add('is-in');
            });
          });
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    );

    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
