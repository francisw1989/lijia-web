'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * 富文本折叠容器：
 * - 默认最多展示 maxHeight（默认 500px），超出部分用底部渐变遮罩隐藏
 * - 点击「View All」展开 / 「Show Less」收起
 * - 内容本身不超过 maxHeight 时不显示按钮，也不做任何裁剪
 */
export function CollapsibleBody({
  html,
  maxHeight = 450,
  className = '',
  bodyClassName = '',
  expandLabel = 'View All',
  collapseLabel = 'Show Less',
}: {
  html: string;
  maxHeight?: number;
  className?: string;
  bodyClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  /** 是否已测量过（未测量前先按折叠态渲染，避免整段文字闪一下再收起） */
  const [measured, setMeasured] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      setOverflowing(el.offsetHeight > maxHeight + 4);
      setMeasured(true);
    };
    measure();
    // 图片、字体加载后高度会变化，持续校正
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html, maxHeight]);

  const clamped = !expanded && (!measured || overflowing);
  const showFade = clamped && measured && overflowing;

  const toggle = () => {
    if (expanded) {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect && rect.top < 0) {
        window.scrollBy({ top: rect.top - 96, behavior: 'smooth' });
      }
    }
    setExpanded((value) => !value);
  };

  const toggleButton = (label: string, up: boolean) => (
    <button
      type="button"
      className="collapsible-toggle"
      aria-expanded={expanded}
      aria-controls={contentId}
      onClick={toggle}
    >
      <span>{label}</span>
      <svg
        className={up ? 'is-up' : undefined}
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.5 6L8 10.5L12.5 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={`collapsible${clamped ? ' is-collapsed' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={{ ['--collapsible-max-h' as string]: `${maxHeight}px` }}
    >
      <div id={contentId} className="collapsible-inner">
        <div
          ref={innerRef}
          className={bodyClassName}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {/* 折叠态：按钮压在渐变遮罩上 */}
        {showFade ? (
          <div className="collapsible-fade">{toggleButton(expandLabel, false)}</div>
        ) : null}
      </div>
      {/* 展开态：按钮回到正文下方，用于收起 */}
      {measured && overflowing && expanded ? (
        <div className="collapsible-actions">
          {toggleButton(collapseLabel, true)}
        </div>
      ) : null}
    </div>
  );
}
