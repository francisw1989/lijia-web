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
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.classList.add('is-in');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );

    nodes.forEach((el) => {
      // 已在视口内的（含首屏）立刻显示，避免 opacity:0 白屏
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
      if (inView) {
        el.classList.add('is-in');
        return;
      }
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
