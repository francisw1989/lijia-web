'use client';

import { useMemo, useState } from 'react';
import {
  BOX_MATERIALS,
  downloadTwoPieceBoxPdf,
  type BoxMaterialMm,
} from '@/lib/template-generator/box';
import {
  BOARD_FOLDS,
  downloadGameBoardPdf,
  foldedBoardSize,
  type BoardFoldId,
} from '@/lib/template-generator/board';
import { downloadPunchboardPdf } from '@/lib/template-generator/punchboard';
import { downloadPaperPadPdf } from '@/lib/template-generator/paper-pad';
import {
  SHEET_FOLDS,
  downloadPaperSheetPdf,
  type SheetFoldId,
} from '@/lib/template-generator/paper-sheet';
import {
  CARD_SIZES,
  DEFAULT_CARD_SIZE_ID,
  cardOptionLabel,
  cardPreviewCaption,
  downloadCardsPdf,
  getCardSize,
} from '@/lib/template-generator/cards';

const TEMPLATES = [
  { id: 'two-piece-box', label: 'Two Piece Game Box' },
  { id: 'game-board', label: 'Game Board' },
  { id: 'punchboard', label: 'Cardboard Punchboard' },
  { id: 'paper-sheet', label: 'Paper Sheet' },
  { id: 'cards', label: 'Cards' },
  { id: 'paper-pad', label: 'Paper Pad' },
] as const;

type TemplateId = (typeof TEMPLATES)[number]['id'];

function parseDim(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function formatFolded(n: number) {
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
}

const SAMPLE_LOGO = '/images/logo-2.png';
const SAMPLE_LOGO_RATIO = 216 / 211;

function SampleLogo({
  cx,
  cy,
  size = 28,
}: {
  cx: number;
  cy: number;
  size?: number;
}) {
  const w = size;
  const h = size * SAMPLE_LOGO_RATIO;
  return (
    <image
      href={SAMPLE_LOGO}
      x={cx - w / 2}
      y={cy - h / 2}
      width={w}
      height={h}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function BoxDiagram({ x, y, z }: { x: string; y: string; z: string }) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';
  const lz = z.trim() ? `${z} mm` : 'Z mm';

  const N = [168, 188] as const;
  const L = [72, 140] as const;
  const R = [264, 140] as const;
  const h = 64;
  const TN = [N[0], N[1] - h] as const;
  const TL = [L[0], L[1] - h] as const;
  const TR = [R[0], R[1] - h] as const;
  const TF = [TL[0] + (R[0] - N[0]), TL[1] + (R[1] - N[1])] as const;

  const top = `${TL[0]},${TL[1]} ${TF[0]},${TF[1]} ${TR[0]},${TR[1]} ${TN[0]},${TN[1]}`;
  const left = `${L[0]},${L[1]} ${N[0]},${N[1]} ${TN[0]},${TN[1]} ${TL[0]},${TL[1]}`;
  const right = `${N[0]},${N[1]} ${R[0]},${R[1]} ${TR[0]},${TR[1]} ${TN[0]},${TN[1]}`;

  const lid = 8;
  const Nl = [N[0], N[1] - lid] as const;
  const Ll = [L[0], L[1] - lid] as const;
  const Rl = [R[0], R[1] - lid] as const;
  const hz = (TR[1] + R[1]) / 2;

  const angL = (Math.atan2(N[1] - L[1], N[0] - L[0]) * 180) / Math.PI;
  const angR = (Math.atan2(R[1] - N[1], R[0] - N[0]) * 180) / Math.PI;
  const labelAlong = (
    a: readonly [number, number],
    b: readonly [number, number],
    dist: number,
  ) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    // SVG y 向下：法向 (-dy, dx) 指向外侧下方
    return [(a[0] + b[0]) / 2 - (dy / len) * dist, (a[1] + b[1]) / 2 + (dx / len) * dist] as [
      number,
      number,
    ];
  };
  const xPos = labelAlong(L, N, 18);
  const yPos = labelAlong(N, R, 18);

  return (
    <svg
      className="tg-diagram"
      viewBox="0 0 420 240"
      role="img"
      aria-label="Two piece box dimensions diagram"
    >
      <polygon points={top} className="tg-box-top" />
      <polygon points={left} className="tg-box-side tg-box-side-left" />
      <polygon points={right} className="tg-box-side tg-box-side-right" />
      <polyline
        points={`${Ll[0]},${Ll[1]} ${Nl[0]},${Nl[1]} ${Rl[0]},${Rl[1]}`}
        className="tg-box-lid"
      />
      <g className="tg-box-edges">
        <polygon points={top} fill="none" />
        <polygon points={left} fill="none" />
        <polygon points={right} fill="none" />
      </g>
      <SampleLogo
        cx={(TL[0] + TF[0] + TR[0] + TN[0]) / 4 + 18}
        cy={(TL[1] + TF[1] + TR[1] + TN[1]) / 4 - 2}
        size={32}
      />

      <text
        x={xPos[0]}
        y={xPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angL} ${xPos[0]} ${xPos[1]})`}
      >
        {lx} (width)
      </text>
      <text
        x={yPos[0]}
        y={yPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angR} ${yPos[0]} ${yPos[1]})`}
      >
        {ly} (length)
      </text>
      <path
        d={`M ${TR[0] + 16} ${TR[1] + 8} Q ${TR[0] + 34} ${hz} ${R[0] + 12} ${R[1] - 6}`}
        className="tg-diagram-arrow"
        fill="none"
      />
      <text x={TR[0] + 42} y={hz + 4} textAnchor="start" className="tg-diagram-label">
        {lz} (height)
      </text>
    </svg>
  );
}

function BoardDiagram({
  x,
  y,
  fold,
}: {
  x: string;
  y: string;
  fold: BoardFoldId;
}) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';
  const foldLabel = BOARD_FOLDS.find((f) => f.id === fold)?.label ?? '';

  // 等轴测矩形：X 右下、Y 右上（两边不平行）
  const BL = [90, 140] as const;
  const BR = [250, 180] as const;
  const TL = [150, 80] as const;
  const TR = [310, 120] as const;
  const face = `${BL[0]},${BL[1]} ${BR[0]},${BR[1]} ${TR[0]},${TR[1]} ${TL[0]},${TL[1]}`;

  const foldPaths: string[] = [];
  const addIsoH = (parts: number) => {
    for (let i = 1; i < parts; i += 1) {
      const t = i / parts;
      const Lpt = [BL[0] + (TL[0] - BL[0]) * t, BL[1] + (TL[1] - BL[1]) * t];
      const Rpt = [BR[0] + (TR[0] - BR[0]) * t, BR[1] + (TR[1] - BR[1]) * t];
      foldPaths.push(`M ${Lpt[0]} ${Lpt[1]} L ${Rpt[0]} ${Rpt[1]}`);
    }
  };
  const addIsoV = (parts: number) => {
    for (let i = 1; i < parts; i += 1) {
      const t = i / parts;
      const Bpt = [BL[0] + (BR[0] - BL[0]) * t, BL[1] + (BR[1] - BL[1]) * t];
      const Tpt = [TL[0] + (TR[0] - TL[0]) * t, TL[1] + (TR[1] - TL[1]) * t];
      foldPaths.push(`M ${Bpt[0]} ${Bpt[1]} L ${Tpt[0]} ${Tpt[1]}`);
    }
  };

  if (fold === 'half-h') addIsoH(2);
  else if (fold === 'third-h') addIsoH(3);
  else if (fold === 'half-v') addIsoV(2);
  else if (fold === 'third-v') addIsoV(3);
  else if (fold === 'quarter') {
    addIsoH(2);
    addIsoV(2);
  } else if (fold === 'sixth') {
    const dx = Number(x);
    const dy = Number(y);
    const landscape = !(Number.isFinite(dx) && Number.isFinite(dy)) || dx >= dy;
    if (landscape) {
      addIsoV(3);
      addIsoH(2);
    } else {
      addIsoV(2);
      addIsoH(3);
    }
  }

  const angX = (Math.atan2(BR[1] - BL[1], BR[0] - BL[0]) * 180) / Math.PI;
  const angY = (Math.atan2(TR[1] - BR[1], TR[0] - BR[0]) * 180) / Math.PI;
  const centroid = [
    (BL[0] + BR[0] + TR[0] + TL[0]) / 4,
    (BL[1] + BR[1] + TR[1] + TL[1]) / 4,
  ] as const;
  const labelAlong = (
    a: readonly [number, number],
    b: readonly [number, number],
    dist: number,
  ) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const toward =
      (mx + nx - centroid[0]) ** 2 + (my + ny - centroid[1]) ** 2 <
      (mx - centroid[0]) ** 2 + (my - centroid[1]) ** 2;
    if (toward) {
      nx = -nx;
      ny = -ny;
    }
    return [mx + nx * dist, my + ny * dist] as [number, number];
  };
  const xPos = labelAlong(BL, BR, 16);
  const yPos = labelAlong(BR, TR, 16);

  return (
    <div className="tg-board-preview">
      <svg
        className="tg-diagram"
        viewBox="40 48 320 168"
        role="img"
        aria-label="Game board dimensions diagram"
      >
        <polygon points={face} className="tg-board-face" />
        <polygon points={face} className="tg-board-edge" fill="none" />
        <SampleLogo
          cx={BL[0] + (BR[0] - BL[0]) * 0.78 + (TL[0] - BL[0]) * 0.72}
          cy={BL[1] + (BR[1] - BL[1]) * 0.78 + (TL[1] - BL[1]) * 0.72}
          size={30}
        />
        {foldPaths.map((d) => (
          <path key={d} d={d} className="tg-board-fold" />
        ))}
        <text
          x={xPos[0]}
          y={xPos[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className="tg-diagram-label"
          transform={`rotate(${angX} ${xPos[0]} ${xPos[1]})`}
        >
          {lx} (width)
        </text>
        <text
          x={yPos[0]}
          y={yPos[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className="tg-diagram-label"
          transform={`rotate(${angY} ${yPos[0]} ${yPos[1]})`}
        >
          {ly} (height)
        </text>
      </svg>
      {fold !== 'none' ? <p className="tg-board-fold-caption">{foldLabel}</p> : null}
    </div>
  );
}

function PunchboardDiagram({ x, y }: { x: string; y: string }) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';

  const BL = [90, 148] as const;
  const BR = [262, 188] as const;
  const TL = [138, 72] as const;
  const TR = [310, 112] as const;
  const face = `${BL[0]},${BL[1]} ${BR[0]},${BR[1]} ${TR[0]},${TR[1]} ${TL[0]},${TL[1]}`;

  const iso = (u: number, v: number) => {
    const x0 = BL[0] + (BR[0] - BL[0]) * u + (TL[0] - BL[0]) * v;
    const y0 = BL[1] + (BR[1] - BL[1]) * u + (TL[1] - BL[1]) * v;
    return [x0, y0] as const;
  };

  const tokenR = 0.09;
  const tokens: { u: number; v: number; kind: 'plain' | 'five' | 'one' | 'face' }[] = [
    { u: 0.22, v: 0.78, kind: 'plain' },
    { u: 0.5, v: 0.78, kind: 'five' },
    { u: 0.78, v: 0.78, kind: 'plain' },
    { u: 0.22, v: 0.5, kind: 'one' },
    { u: 0.5, v: 0.5, kind: 'face' },
    { u: 0.78, v: 0.5, kind: 'plain' },
    { u: 0.22, v: 0.22, kind: 'plain' },
    { u: 0.5, v: 0.22, kind: 'five' },
    { u: 0.78, v: 0.22, kind: 'one' },
  ];

  const tokenPath = (u: number, v: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 32; i += 1) {
      const a = (Math.PI * 2 * i) / 32;
      const [px, py] = iso(u + Math.cos(a) * tokenR, v + Math.sin(a) * tokenR);
      pts.push(`${px},${py}`);
    }
    return pts.join(' ');
  };

  const angX = (Math.atan2(BR[1] - BL[1], BR[0] - BL[0]) * 180) / Math.PI;
  const angY = (Math.atan2(TR[1] - BR[1], TR[0] - BR[0]) * 180) / Math.PI;
  const labelAlong = (
    a: readonly [number, number],
    b: readonly [number, number],
    dist: number,
  ) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [(a[0] + b[0]) / 2 - (dy / len) * dist, (a[1] + b[1]) / 2 + (dx / len) * dist] as [
      number,
      number,
    ];
  };
  const xPos = labelAlong(BL, BR, 16);
  const yPos = labelAlong(BR, TR, 16);

  return (
    <svg
      className="tg-diagram"
      viewBox="40 48 340 180"
      role="img"
      aria-label="Punchboard dimensions diagram"
    >
      <polygon points={face} className="tg-punch-face" />
      <polygon points={face} className="tg-board-edge" fill="none" />
      {tokens.map((token, i) => {
        const [cx, cy] = iso(token.u, token.v);
        return (
          <g key={`${token.kind}-${i}`}>
            <polygon points={tokenPath(token.u, token.v)} className="tg-punch-token" />
            {token.kind === 'five' ? (
              <text x={cx} y={cy + 4} textAnchor="middle" className="tg-punch-mark">
                5
              </text>
            ) : null}
            {token.kind === 'one' ? (
              <text x={cx} y={cy + 4} textAnchor="middle" className="tg-punch-mark">
                1
              </text>
            ) : null}
            {token.kind === 'face' ? (
              <SampleLogo cx={cx} cy={cy} size={16} />
            ) : null}
          </g>
        );
      })}
      <text
        x={xPos[0]}
        y={xPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angX} ${xPos[0]} ${xPos[1]})`}
      >
        {lx} (width)
      </text>
      <text
        x={yPos[0]}
        y={yPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angY} ${yPos[0]} ${yPos[1]})`}
      >
        {ly} (height)
      </text>
    </svg>
  );
}

function CardDiagram({
  widthMm,
  heightMm,
  showAxisLabels,
}: {
  widthMm: number;
  heightMm: number;
  showAxisLabels: boolean;
}) {
  const ratio = widthMm > 0 && heightMm > 0 ? widthMm / heightMm : 1;
  const landscape = ratio >= 1;
  const BL = landscape ? ([92, 150] as const) : ([118, 162] as const);
  const BR = landscape ? ([268, 186] as const) : ([248, 186] as const);
  const TL = landscape ? ([128, 78] as const) : ([154, 70] as const);
  const TR = landscape ? ([304, 114] as const) : ([284, 94] as const);
  const face = `${BL[0]},${BL[1]} ${BR[0]},${BR[1]} ${TR[0]},${TR[1]} ${TL[0]},${TL[1]}`;

  const angX = (Math.atan2(BR[1] - BL[1], BR[0] - BL[0]) * 180) / Math.PI;
  const angY = (Math.atan2(TR[1] - BR[1], TR[0] - BR[0]) * 180) / Math.PI;
  const labelAlong = (
    a: readonly [number, number],
    b: readonly [number, number],
    dist: number,
  ) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [(a[0] + b[0]) / 2 - (dy / len) * dist, (a[1] + b[1]) / 2 + (dx / len) * dist] as [
      number,
      number,
    ];
  };
  const xPos = labelAlong(BL, BR, 16);
  const yPos = labelAlong(BR, TR, 16);
  const lx = Number.isFinite(widthMm) && widthMm > 0 ? `${widthMm} mm` : 'X mm';
  const ly = Number.isFinite(heightMm) && heightMm > 0 ? `${heightMm} mm` : 'Y mm';

  return (
    <svg
      className="tg-diagram"
      viewBox="40 48 340 180"
      role="img"
      aria-label="Card dimensions diagram"
    >
      <polygon points={face} className="tg-card-face" />
      <polygon points={face} className="tg-board-edge" fill="none" />
      <SampleLogo
        cx={(BL[0] + BR[0] + TR[0] + TL[0]) / 4}
        cy={(BL[1] + BR[1] + TR[1] + TL[1]) / 4}
        size={landscape ? 26 : 30}
      />
      {showAxisLabels ? (
        <>
          <text
            x={xPos[0]}
            y={xPos[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            className="tg-diagram-label"
            transform={`rotate(${angX} ${xPos[0]} ${xPos[1]})`}
          >
            {lx} (width)
          </text>
          <text
            x={yPos[0]}
            y={yPos[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            className="tg-diagram-label"
            transform={`rotate(${angY} ${yPos[0]} ${yPos[1]})`}
          >
            {ly} (height)
          </text>
        </>
      ) : null}
    </svg>
  );
}

function PaperSheetDiagram({ x, y, fold }: { x: string; y: string; fold: SheetFoldId }) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';
  const foldLabel = SHEET_FOLDS.find((item) => item.id === fold)?.label ?? '';

  const BL = [92, 150] as const;
  const BR = [268, 186] as const;
  const TL = [128, 78] as const;
  const TR = [304, 114] as const;
  const face = `${BL[0]},${BL[1]} ${BR[0]},${BR[1]} ${TR[0]},${TR[1]} ${TL[0]},${TL[1]}`;

  const iso = (u: number, v: number) => {
    const x0 = BL[0] + (BR[0] - BL[0]) * u + (TL[0] - BL[0]) * v;
    const y0 = BL[1] + (BR[1] - BL[1]) * u + (TL[1] - BL[1]) * v;
    return [x0, y0] as const;
  };
  const quad = (u0: number, v0: number, u1: number, v1: number) => {
    const a = iso(u0, v0);
    const b = iso(u1, v0);
    const c = iso(u1, v1);
    const d = iso(u0, v1);
    return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d[0]},${d[1]}`;
  };

  const foldPaths: string[] = [];
  const addIsoH = (parts: number) => {
    for (let i = 1; i < parts; i += 1) {
      const t = i / parts;
      const Lpt = iso(0, t);
      const Rpt = iso(1, t);
      foldPaths.push(`M ${Lpt[0]} ${Lpt[1]} L ${Rpt[0]} ${Rpt[1]}`);
    }
  };
  const addIsoV = (parts: number) => {
    for (let i = 1; i < parts; i += 1) {
      const t = i / parts;
      const Bpt = iso(t, 0);
      const Tpt = iso(t, 1);
      foldPaths.push(`M ${Bpt[0]} ${Bpt[1]} L ${Tpt[0]} ${Tpt[1]}`);
    }
  };
  if (fold === 'half-h') addIsoH(2);
  else if (fold === 'third-h') addIsoH(3);
  else if (fold === 'half-v') addIsoV(2);
  else if (fold === 'third-v') addIsoV(3);
  else if (fold === 'quarter') {
    addIsoH(2);
    addIsoV(2);
  }

  const angX = (Math.atan2(BR[1] - BL[1], BR[0] - BL[0]) * 180) / Math.PI;
  const angY = (Math.atan2(TR[1] - BR[1], TR[0] - BR[0]) * 180) / Math.PI;
  const labelAlong = (
    a: readonly [number, number],
    b: readonly [number, number],
    dist: number,
  ) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [(a[0] + b[0]) / 2 - (dy / len) * dist, (a[1] + b[1]) / 2 + (dx / len) * dist] as [
      number,
      number,
    ];
  };
  const xPos = labelAlong(BL, BR, 16);
  const yPos = labelAlong(BR, TR, 16);
  const logo = iso(0.82, 0.78);
  const rules = [0.42, 0.5, 0.58, 0.66];

  return (
    <div className="tg-board-preview">
      <svg
        className="tg-diagram"
        viewBox="40 48 340 180"
        role="img"
        aria-label="Paper sheet dimensions diagram"
      >
        <polygon points={face} className="tg-sheet-face" />
        <polygon points={face} className="tg-board-edge" fill="none" />
        <polygon points={quad(0.08, 0.62, 0.55, 0.86)} className="tg-sheet-block" />
        <polygon points={quad(0.6, 0.18, 0.92, 0.48)} className="tg-sheet-block" />
        {rules.map((v) => {
          const a = iso(0.1, v);
          const b = iso(0.52, v);
          return (
            <line key={v} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="tg-sheet-rule" />
          );
        })}
        <SampleLogo cx={logo[0]} cy={logo[1]} size={28} />
        {foldPaths.map((d) => (
          <path key={d} d={d} className="tg-board-fold" />
        ))}
        <text
          x={xPos[0]}
          y={xPos[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className="tg-diagram-label"
          transform={`rotate(${angX} ${xPos[0]} ${xPos[1]})`}
        >
          {lx} (width)
        </text>
        <text
          x={yPos[0]}
          y={yPos[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className="tg-diagram-label"
          transform={`rotate(${angY} ${yPos[0]} ${yPos[1]})`}
        >
          {ly} (height)
        </text>
      </svg>
      {fold !== 'none' ? <p className="tg-board-fold-caption">{foldLabel}</p> : null}
    </div>
  );
}

function PaperPadDiagram({ x, y }: { x: string; y: string }) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';

  const BL = [96, 142] as const;
  const BR = [258, 178] as const;
  const TL = [132, 70] as const;
  const TR = [294, 106] as const;
  const dz = 16;
  const BLb: [number, number] = [BL[0], BL[1] + dz];
  const BRb: [number, number] = [BR[0], BR[1] + dz];
  const TRb: [number, number] = [TR[0], TR[1] + dz];
  const top = `${BL[0]},${BL[1]} ${BR[0]},${BR[1]} ${TR[0]},${TR[1]} ${TL[0]},${TL[1]}`;
  const front = `${BL[0]},${BL[1]} ${BR[0]},${BR[1]} ${BRb[0]},${BRb[1]} ${BLb[0]},${BLb[1]}`;
  const side = `${BR[0]},${BR[1]} ${TR[0]},${TR[1]} ${TRb[0]},${TRb[1]} ${BRb[0]},${BRb[1]}`;

  const iso = (u: number, v: number) => {
    const x0 = BL[0] + (BR[0] - BL[0]) * u + (TL[0] - BL[0]) * v;
    const y0 = BL[1] + (BR[1] - BL[1]) * u + (TL[1] - BL[1]) * v;
    return [x0, y0] as const;
  };

  const angX = (Math.atan2(BR[1] - BL[1], BR[0] - BL[0]) * 180) / Math.PI;
  const angY = (Math.atan2(TR[1] - BR[1], TR[0] - BR[0]) * 180) / Math.PI;
  const labelAlong = (
    a: readonly [number, number],
    b: readonly [number, number],
    dist: number,
  ) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [(a[0] + b[0]) / 2 - (dy / len) * dist, (a[1] + b[1]) / 2 + (dx / len) * dist] as [
      number,
      number,
    ];
  };
  const xPos = labelAlong(BLb, BRb, 16);
  const yPos = labelAlong(BRb, TRb, 16);

  const logo = iso(0.78, 0.7);
  const ruled = [0.28, 0.4, 0.52, 0.64, 0.76];

  return (
    <svg
      className="tg-diagram"
      viewBox="40 48 340 180"
      role="img"
      aria-label="Paper pad dimensions diagram"
    >
      <polygon points={front} className="tg-pad-front" />
      <polygon points={side} className="tg-pad-side" />
      <polygon points={top} className="tg-pad-top" />
      <g className="tg-pad-edges">
        <polygon points={top} fill="none" />
        <polygon points={front} fill="none" />
        <polygon points={side} fill="none" />
      </g>
      {ruled.map((v) => {
        const a = iso(0.1, v);
        const b = iso(0.5, v);
        return (
          <line
            key={v}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            className="tg-pad-rule"
          />
        );
      })}
      <SampleLogo cx={logo[0]} cy={logo[1]} size={30} />
      <text
        x={xPos[0]}
        y={xPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angX} ${xPos[0]} ${xPos[1]})`}
      >
        {lx} (width)
      </text>
      <text
        x={yPos[0]}
        y={yPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angY} ${yPos[0]} ${yPos[1]})`}
      >
        {ly} (height)
      </text>
    </svg>
  );
}

function StackedCardsIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 64 48">
      <rect
        x="16"
        y="8"
        width="28"
        height="22"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="20"
        y="14"
        width="28"
        height="22"
        rx="3"
        fill={filled ? 'currentColor' : 'none'}
        opacity={filled ? 0.18 : 1}
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function TemplateIcon({ id }: { id: TemplateId }) {
  if (id === 'game-board') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="8"
          y="10"
          width="48"
          height="28"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M8 24 H56" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      </svg>
    );
  }
  if (id === 'punchboard') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="8"
          y="10"
          width="48"
          height="28"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="20" cy="20" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="32" cy="20" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="44" cy="20" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="20" cy="32" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="44" cy="32" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (id === 'cards') {
    return <StackedCardsIcon />;
  }
  if (id === 'paper-sheet') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="12"
          y="8"
          width="40"
          height="32"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M32 8 V40" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (id === 'paper-pad') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="14"
          y="8"
          width="36"
          height="24"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="12"
          y="12"
          width="36"
          height="24"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="10"
          y="16"
          width="36"
          height="24"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 48">
      <path
        d="M8 18 L32 8 L56 18 L56 34 L32 44 L8 34 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M32 8 V44 M8 18 L32 28 L56 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function TemplateGeneratorApp() {
  const [template, setTemplate] = useState<TemplateId>('two-piece-box');
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');
  const [material, setMaterial] = useState<BoxMaterialMm | ''>('');
  const [fold, setFold] = useState<BoardFoldId>('half-h');
  const [doubleSided, setDoubleSided] = useState(false);
  const [cardMode, setCardMode] = useState<'standard' | 'custom'>('standard');
  const [cardSizeId, setCardSizeId] = useState(DEFAULT_CARD_SIZE_ID);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isBox = template === 'two-piece-box';
  const isPunchboard = template === 'punchboard';
  const isCards = template === 'cards';
  const isPaperPad = template === 'paper-pad';
  const isPaperSheet = template === 'paper-sheet';
  const isXyOnly = isPunchboard || isPaperPad;
  const sheetFold: SheetFoldId = fold === 'sixth' ? 'half-h' : fold;
  const selectedCard = getCardSize(cardSizeId);
  const cardW = cardMode === 'standard' ? selectedCard.w : parseDim(x);
  const cardH = cardMode === 'standard' ? selectedCard.h : parseDim(y);

  const folded = useMemo(() => {
    const dx = parseDim(x);
    const dy = parseDim(y);
    if (!(dx >= 10) || !(dy >= 10)) return null;
    return foldedBoardSize(dx, dy, isPaperSheet ? sheetFold : fold);
  }, [x, y, fold, isPaperSheet, sheetFold]);

  const valid = useMemo(() => {
    const dx = parseDim(x);
    const dy = parseDim(y);
    if (isBox) {
      const dz = parseDim(z);
      return (
        material !== '' &&
        dx >= 10 &&
        dy >= 10 &&
        dz >= 10 &&
        dx <= 600 &&
        dy <= 600 &&
        dz <= 600
      );
    }
    if (isCards) {
      return cardW >= 20 && cardH >= 20 && cardW <= 300 && cardH <= 300;
    }
    return dx >= 10 && dy >= 10 && dx <= 1200 && dy <= 1200;
  }, [isBox, isCards, x, y, z, material, cardW, cardH]);

  const onDownload = async () => {
    setError('');
    if (!valid) {
      setError(
        isBox
          ? 'Enter X / Y / Z (10–600 mm) and choose a material.'
          : isCards
            ? 'Enter X / Y (20–300 mm) or choose a standard size.'
            : 'Enter X / Y (10–1200 mm).',
      );
      return;
    }
    setBusy(true);
    try {
      if (isBox) {
        await downloadTwoPieceBoxPdf({
          x: parseDim(x),
          y: parseDim(y),
          z: parseDim(z),
          thickness: material as BoxMaterialMm,
        });
      } else if (isPunchboard) {
        await downloadPunchboardPdf({
          x: parseDim(x),
          y: parseDim(y),
        });
      } else if (isPaperPad) {
        await downloadPaperPadPdf({
          x: parseDim(x),
          y: parseDim(y),
        });
      } else if (isPaperSheet) {
        await downloadPaperSheetPdf({
          x: parseDim(x),
          y: parseDim(y),
          fold: sheetFold,
        });
      } else if (isCards) {
        await downloadCardsPdf({
          w: cardW,
          h: cardH,
          perSheet: cardMode === 'standard' ? selectedCard.perSheet : undefined,
        });
      } else {
        await downloadGameBoardPdf({
          x: parseDim(x),
          y: parseDim(y),
          fold,
          doubleSided,
        });
      }
    } catch {
      setError('Could not generate the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tg-page">
      <ol className="tg-steps">
        <li className="tg-step">
          <h2>
            <span>1</span> Choose your template
          </h2>
          <div className="tg-template-row">
            {TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tg-template${template === item.id ? ' is-active' : ''}`}
                aria-pressed={template === item.id}
                onClick={() => {
                  setTemplate(item.id);
                  setError('');
                  if (item.id === 'paper-sheet' && fold === 'sixth') {
                    setFold('half-h');
                  }
                }}
              >
                <span className="tg-template-icon" aria-hidden>
                  <TemplateIcon id={item.id} />
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </li>

        <li className="tg-step">
          <h2>
            <span>2</span> Enter your dimensions
          </h2>
          {isCards ? (
            <div className="tg-cards-step">
              <div className="tg-template-row tg-card-modes">
                <button
                  type="button"
                  className={`tg-template${cardMode === 'standard' ? ' is-active' : ''}`}
                  aria-pressed={cardMode === 'standard'}
                  onClick={() => setCardMode('standard')}
                >
                  <span className="tg-template-icon" aria-hidden>
                    <StackedCardsIcon />
                  </span>
                  Standard Size
                </button>
                <button
                  type="button"
                  className={`tg-template${cardMode === 'custom' ? ' is-active' : ''}`}
                  aria-pressed={cardMode === 'custom'}
                  onClick={() => {
                    setX(String(selectedCard.w));
                    setY(String(selectedCard.h));
                    setCardMode('custom');
                  }}
                >
                  <span className="tg-template-icon" aria-hidden>
                    <StackedCardsIcon filled />
                  </span>
                  Custom Size
                </button>
              </div>
              <div className="tg-dims">
                <div className="tg-card-preview">
                  <p className="tg-card-preview-title">
                    {cardMode === 'standard' ? 'Card Type (example)' : 'Card Size'}
                  </p>
                  <CardDiagram
                    widthMm={cardW}
                    heightMm={cardH}
                    showAxisLabels={cardMode === 'custom'}
                  />
                  {cardMode === 'standard' ? (
                    <p className="tg-card-caption">{cardPreviewCaption(selectedCard)}</p>
                  ) : null}
                </div>
                <div className="tg-fields">
                  {cardMode === 'standard' ? (
                    <label className="tg-field">
                      <span>Card Type</span>
                      <select
                        value={cardSizeId}
                        onChange={(e) => setCardSizeId(e.target.value)}
                      >
                        <optgroup label="Common Sizes">
                          {CARD_SIZES.filter((item) => item.group === 'common').map((item) => (
                            <option key={item.id} value={item.id}>
                              {cardOptionLabel(item)}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other Available Sizes">
                          {CARD_SIZES.filter((item) => item.group === 'other').map((item) => (
                            <option key={item.id} value={item.id}>
                              {cardOptionLabel(item)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                  ) : (
                    <>
                      <label className="tg-field">
                        <span>X mm (width)</span>
                        <input
                          inputMode="decimal"
                          value={x}
                          onChange={(e) => setX(e.target.value)}
                          placeholder="e.g. 63"
                        />
                      </label>
                      <label className="tg-field">
                        <span>Y mm (height)</span>
                        <input
                          inputMode="decimal"
                          value={y}
                          onChange={(e) => setY(e.target.value)}
                          placeholder="e.g. 88"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="tg-dims">
              {isBox ? (
                <BoxDiagram x={x} y={y} z={z} />
              ) : isPunchboard ? (
                <PunchboardDiagram x={x} y={y} />
              ) : isPaperPad ? (
                <PaperPadDiagram x={x} y={y} />
              ) : isPaperSheet ? (
                <PaperSheetDiagram x={x} y={y} fold={sheetFold} />
              ) : (
                <BoardDiagram x={x} y={y} fold={fold} />
              )}
              <div className="tg-fields">
                <label className="tg-field">
                  <span>X mm (width)</span>
                  <input
                    inputMode="decimal"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    placeholder="e.g. 150"
                  />
                </label>
                <label className="tg-field">
                  <span>Y mm ({isBox ? 'length' : 'height'})</span>
                  <input
                    inputMode="decimal"
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    placeholder="e.g. 150"
                  />
                </label>

                {isBox ? (
                  <>
                    <label className="tg-field">
                      <span>Z mm (height)</span>
                      <input
                        inputMode="decimal"
                        value={z}
                        onChange={(e) => setZ(e.target.value)}
                        placeholder="e.g. 50"
                      />
                    </label>
                    <label className="tg-field">
                      <span>Material</span>
                      <select
                        value={material}
                        onChange={(e) =>
                          setMaterial(
                            e.target.value ? (Number(e.target.value) as BoxMaterialMm) : '',
                          )
                        }
                      >
                        <option value="">- Select -</option>
                        {BOX_MATERIALS.map((item) => (
                          <option key={item.mm} value={item.mm}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : isXyOnly ? null : (
                  <>
                    <label className="tg-field">
                      <span>Folds</span>
                      <select
                        value={isPaperSheet ? sheetFold : fold}
                        onChange={(e) => setFold(e.target.value as BoardFoldId)}
                      >
                        {(isPaperSheet ? SHEET_FOLDS : BOARD_FOLDS).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="tg-folded">
                      <span>Folded Dimensions</span>
                      <strong>
                        @{' '}
                        {folded
                          ? `${formatFolded(folded.w)} x ${formatFolded(folded.h)}`
                          : '0 x 0'}
                      </strong>
                    </div>
                    {isPaperSheet ? null : (
                      <label className="tg-check">
                        <input
                          type="checkbox"
                          checked={doubleSided}
                          onChange={(e) => setDoubleSided(e.target.checked)}
                        />
                        <span>Double Sided</span>
                      </label>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </li>

        <li className="tg-step">
          <h2>
            <span>3</span> Download your template
          </h2>
          <button
            type="button"
            className="btn btn-primary tg-download"
            disabled={busy}
            onClick={onDownload}
          >
            {busy ? 'Generating…' : 'Download PDF'}
          </button>
          {error ? <p className="tg-error">{error}</p> : null}
        </li>
      </ol>
    </div>
  );
}
