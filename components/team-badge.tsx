'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';

type TeamBadgeProps = {
  name: string;
  role: string;
};

const SLANT = 11;
const RADIUS = 9;

/** 右倾平行四边形路径（随容器宽高生成，作背景） */
function parallelogramPath(width: number, height: number) {
  const s = Math.min(SLANT, width * 0.12);
  const r = Math.min(RADIUS, height / 2.2, (width - s) / 4);
  const w = Math.max(width, s + r * 2 + 4);
  const h = Math.max(height, 1);

  const tl = { x: s, y: 0 };
  const tr = { x: w, y: 0 };
  const br = { x: w - s, y: h };
  const bl = { x: 0, y: h };

  const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len };
  };

  const top = edge(tl, tr);
  const right = edge(tr, br);
  const bottom = edge(br, bl);
  const left = edge(bl, tl);

  const rTL = r;
  const rTR = r * 0.4;
  const rBR = r;
  const rBL = r * 0.4;

  const p1 = { x: tl.x + top.dx * rTL, y: tl.y + top.dy * rTL };
  const p2 = { x: tr.x - top.dx * rTR, y: tr.y - top.dy * rTR };
  const p3 = { x: tr.x + right.dx * rTR, y: tr.y + right.dy * rTR };
  const p4 = { x: br.x - right.dx * rBR, y: br.y - right.dy * rBR };
  const p5 = { x: br.x + bottom.dx * rBR, y: br.y + bottom.dy * rBR };
  const p6 = { x: bl.x - bottom.dx * rBL, y: bl.y - bottom.dy * rBL };
  const p7 = { x: bl.x + left.dx * rBL, y: bl.y + left.dy * rBL };
  const p8 = { x: tl.x - left.dx * rTL, y: tl.y - left.dy * rTL };

  return {
    d: [
      `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `Q ${tr.x} ${tr.y} ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      `L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
      `Q ${br.x} ${br.y} ${p5.x.toFixed(2)} ${p5.y.toFixed(2)}`,
      `L ${p6.x.toFixed(2)} ${p6.y.toFixed(2)}`,
      `Q ${bl.x} ${bl.y} ${p7.x.toFixed(2)} ${p7.y.toFixed(2)}`,
      `L ${p8.x.toFixed(2)} ${p8.y.toFixed(2)}`,
      `Q ${tl.x} ${tl.y} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      'Z',
    ].join(' '),
    width: w,
    height: h,
  };
}

function BadgeBg({
  width,
  height,
  variant,
  gradientId,
  shadowId,
}: {
  width: number;
  height: number;
  variant: 'name' | 'role';
  gradientId: string;
  shadowId: string;
}) {
  if (width <= 0 || height <= 0) return null;
  const shape = parallelogramPath(width, height);
  const fill =
    variant === 'name' ? 'var(--orange, #f7782c)' : `url(#${gradientId})`;

  return (
    <svg
      className="team-badge-bg"
      width={shape.width}
      height={shape.height}
      viewBox={`0 0 ${shape.width} ${shape.height}`}
      aria-hidden="true"
    >
      {variant === 'role' ? (
        <defs>
          <filter
            id={shadowId}
            x="-30%"
            y="-40%"
            width="160%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2.5"
              floodColor="#072a57"
              floodOpacity="0.18"
            />
          </filter>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fff3e8" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d={shape.d}
        fill={fill}
        filter={variant === 'role' ? `url(#${shadowId})` : undefined}
      />
    </svg>
  );
}

export function TeamBadge({ name, role }: TeamBadgeProps) {
  const uid = useId().replace(/:/g, '');
  const nameRef = useRef<HTMLSpanElement>(null);
  const roleRef = useRef<HTMLSpanElement>(null);
  const [nameSize, setNameSize] = useState({ w: 0, h: 0 });
  const [roleSize, setRoleSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const sync = () => {
      if (nameRef.current) {
        setNameSize({
          w: nameRef.current.offsetWidth,
          h: nameRef.current.offsetHeight,
        });
      }
      if (roleRef.current) {
        setRoleSize({
          w: roleRef.current.offsetWidth,
          h: roleRef.current.offsetHeight,
        });
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    if (nameRef.current) ro.observe(nameRef.current);
    if (roleRef.current) ro.observe(roleRef.current);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [name, role]);

  return (
    <div className="team-badge">
      <span ref={nameRef} className="team-badge-row team-badge-row-name">
        <BadgeBg
          width={nameSize.w}
          height={nameSize.h}
          variant="name"
          gradientId={`team-badge-role-${uid}`}
          shadowId={`team-badge-shadow-${uid}`}
        />
        <span className="team-badge-text">{name}</span>
      </span>
      <span ref={roleRef} className="team-badge-row team-badge-row-role">
        <BadgeBg
          width={roleSize.w}
          height={roleSize.h}
          variant="role"
          gradientId={`team-badge-role-${uid}`}
          shadowId={`team-badge-shadow-${uid}`}
        />
        <span className="team-badge-text">{role}</span>
      </span>
    </div>
  );
}
