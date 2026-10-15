import type { ReactNode } from 'react';
import Link from 'next/link';

type StatKind = 'views' | 'comments' | 'likes';

/** 线框图标，匹配 Blog 卡片参考样式 */
const ICONS: Record<StatKind, ReactNode> = {
  views: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  comments: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 16.5V18.2L7.4 16.5H18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 1 1.75Z"
      />
    </svg>
  ),
  likes: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.2 11 18.3C6.5 14.2 3.5 11.5 3.5 8.4A4.1 4.1 0 0 1 7.6 4.3c1.5 0 3 .7 4 1.9a5.2 5.2 0 0 1 4-1.9 4.1 4.1 0 0 1 4.1 4.1c0 3.1-3 5.8-7.5 9.9L12 19.2Z"
      />
    </svg>
  ),
};

const LABELS: Record<StatKind, string> = {
  views: 'views',
  comments: 'comments',
  likes: 'likes',
};

export function CommunityStat({
  kind,
  value,
  className,
  active,
  disabled,
  onClick,
  href,
}: {
  kind: StatKind;
  value: number;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const label = `${value} ${LABELS[kind]}`;
  const classes = [
    'community-stat',
    onClick || href ? 'is-action' : '',
    active ? 'is-active' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      <span className="community-stat-icon">{ICONS[kind]}</span>
      <span className="community-stat-num">{value}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} title={label} aria-label={label}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        title={label}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={classes} title={label}>
      {inner}
    </span>
  );
}

export function CommunityStats({
  views,
  comments,
  likes,
  className,
  commentsHref,
}: {
  views: number;
  comments: number;
  likes: number;
  className?: string;
  commentsHref?: string;
}) {
  return (
    <div className={`community-stats ${className || ''}`.trim()}>
      <CommunityStat kind="views" value={views} />
      <CommunityStat kind="comments" value={comments} href={commentsHref} />
      <CommunityStat kind="likes" value={likes} />
    </div>
  );
}
