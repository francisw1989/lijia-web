'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

/** 路由切换时滚到页面最顶，避免共用 layout 保留上一页滚动位置 */
export function ScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash) return;

    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.scrollTop = 0;
    document.body.scrollTop = 0;
    html.style.scrollBehavior = prev;
  }, [pathname]);

  return null;
}
