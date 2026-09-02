'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BOX_MATERIALS,
  downloadTwoPieceBoxPdf,
  type BoxMaterialMm,
} from '@/lib/template-generator/box';
import {
  MAGNETIC_THICKNESSES,
  downloadMagneticBoxPdf,
  openMagneticBoxPdf,
  type MagneticThicknessMm,
} from '@/lib/template-generator/magnetic-box';
import { downloadTinBoxPdf } from '@/lib/template-generator/tin-box';
import {
  BOARD_FOLDS,
  downloadGameBoardPdf,
  foldedBoardSize,
  type BoardFoldId,
} from '@/lib/template-generator/board';
import { downloadPunchboardPdf } from '@/lib/template-generator/punchboard';
import { downloadPaperPadPdf } from '@/lib/template-generator/paper-pad';
import { downloadPlayerMatPdf } from '@/lib/template-generator/player-mat';
import {
  DEFAULT_NEOPRENE_RADIUS,
  downloadNeopreneMatPdf,
  NEOPRENE_RADII,
} from '@/lib/template-generator/neoprene-mat';
import {
  bookletInsets,
  downloadRulesBookletPdf,
} from '@/lib/template-generator/rules-booklet';
import {
  CARD_STOCKS,
  cardStockMm,
  downloadTuckboxPdf,
  tuckboxDepthFromCards,
  type CardStockId,
} from '@/lib/template-generator/tuckbox';
import { downloadFoilPackPdf } from '@/lib/template-generator/foil-pack';
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
import type { DiceTemplateFile } from '@/lib/dice-templates';
import { toolsDownloadHref } from '@/lib/tools-download';

const TEMPLATES = [
  { id: 'two-piece-box', label: 'Two Piece Game Box' },
  { id: 'game-board', label: 'Game Board' },
  { id: 'punchboard', label: 'Punchboard' },
  { id: 'cards', label: 'Cards' },
  { id: 'paper-pad', label: 'Paper Pad' },
  { id: 'paper-sheet', label: 'Paper Sheet' },
  { id: 'player-mat', label: 'Paper Player Mats' },
  { id: 'neoprene-mat', label: 'Neoprene Mats' },
  { id: 'rules-booklet', label: 'Rules Booklet' },
  { id: 'dice', label: 'Dices' },
  { id: 'magnetic-box', label: 'Magnetic Box' },
  { id: 'tuckbox', label: 'Tuckbox' },
  { id: 'tin-box', label: 'Tin Box' },
  { id: 'foil-pack', label: 'Foil Pack' },
] as const;

type TemplateId = (typeof TEMPLATES)[number]['id'];

/** 开发时进入 generator 自动预览 magnetic box；生产可用 ?autoMagneticBox=1 触发 */
const DEV_AUTO_MAGNETIC = process.env.NODE_ENV === 'development';
const AUTO_MAGNETIC_DEFAULTS = {
  a: 100,
  b: 100,
  c: 20,
  thickness: 1.5 as MagneticThicknessMm,
};

function shouldAutoOpenMagneticBox() {
  if (DEV_AUTO_MAGNETIC) return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('autoMagneticBox');
}

function parseDim(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function formatFolded(n: number) {
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
}

function BoxDiagram({
  x,
  y,
  z,
  xName = 'X',
  yName = 'Y',
  zName = 'Z',
  xLabel = 'width',
  yLabel = 'length',
  zLabel = 'height',
}: {
  x: string;
  y: string;
  z: string;
  xName?: string;
  yName?: string;
  zName?: string;
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
}) {
  const lx = x.trim() ? `${x} mm` : `${xName} mm`;
  const ly = y.trim() ? `${y} mm` : `${yName} mm`;
  const lz = z.trim() ? `${z} mm` : `${zName} mm`;

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
      <text
        x={xPos[0]}
        y={xPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angL} ${xPos[0]} ${xPos[1]})`}
      >
        {lx} ({xLabel})
      </text>
      <text
        x={yPos[0]}
        y={yPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
        transform={`rotate(${angR} ${yPos[0]} ${yPos[1]})`}
      >
        {ly} ({yLabel})
      </text>
      <path
        d={`M ${TR[0] + 16} ${TR[1] + 8} Q ${TR[0] + 34} ${hz} ${R[0] + 12} ${R[1] - 6}`}
        className="tg-diagram-arrow"
        fill="none"
      />
      <text x={TR[0] + 42} y={hz + 4} textAnchor="start" className="tg-diagram-label">
        {lz} ({zLabel})
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
  const tokens: { u: number; v: number; kind: 'plain' | 'five' | 'one' }[] = [
    { u: 0.22, v: 0.78, kind: 'plain' },
    { u: 0.5, v: 0.78, kind: 'five' },
    { u: 0.78, v: 0.78, kind: 'plain' },
    { u: 0.22, v: 0.5, kind: 'one' },
    { u: 0.5, v: 0.5, kind: 'plain' },
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

function BookletDiagram({ x, y }: { x: string; y: string }) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';

  const BL = [52, 158] as const;
  const BR = [348, 188] as const;
  const TL = [78, 78] as const;
  const TR = [374, 108] as const;
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

  const foldB = iso(0.5, 0);
  const foldT = iso(0.5, 1);
  const leftMid = iso(0.25, 0);
  const angX = (Math.atan2(leftMid[1] - BL[1], leftMid[0] - BL[0]) * 180) / Math.PI;
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
  const xPos = labelAlong(BL, leftMid, 16);
  const yPos = labelAlong(BR, TR, 16);
  const leftRules = [0.32, 0.42, 0.52, 0.62, 0.72];
  const rightRules = [0.3, 0.4, 0.5, 0.6, 0.7];

  return (
    <svg
      className="tg-diagram"
      viewBox="24 48 380 180"
      role="img"
      aria-label="Rules booklet dimensions diagram"
    >
      <polygon points={face} className="tg-sheet-face" />
      <polygon points={face} className="tg-board-edge" fill="none" />
      <polygon points={quad(0.08, 0.22, 0.42, 0.82)} className="tg-sheet-block" />
      <polygon points={quad(0.58, 0.22, 0.92, 0.82)} className="tg-sheet-block" />
      {leftRules.map((v) => {
        const a = iso(0.12, v);
        const b = iso(0.4, v);
        return (
          <line key={`l${v}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="tg-sheet-rule" />
        );
      })}
      {rightRules.map((v) => {
        const a = iso(0.6, v);
        const b = iso(0.88, v);
        return (
          <line key={`r${v}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="tg-sheet-rule" />
        );
      })}
      <path
        d={`M ${foldB[0]} ${foldB[1]} L ${foldT[0]} ${foldT[1]}`}
        className="tg-board-fold"
      />
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

function FoilPackDiagram({
  x,
  y,
  z,
}: {
  x: string;
  y: string;
  z: string;
}) {
  const la = x.trim() ? `${x} mm` : 'A mm';
  const lb = y.trim() ? `${y} mm` : 'B mm';
  const lc = z.trim() ? `${z} mm` : 'C mm';

  // 竖立薄长方体（左侧面、正面、顶面）
  const FR: [number, number] = [292, 198];
  const FL: [number, number] = [188, 218];
  const TL: [number, number] = [188, 72];
  const TR: [number, number] = [292, 52];
  const d: [number, number] = [-34, -16];

  const face = `${FL[0]},${FL[1]} ${FR[0]},${FR[1]} ${TR[0]},${TR[1]} ${TL[0]},${TL[1]}`;
  const side = `${FL[0]},${FL[1]} ${FL[0] + d[0]},${FL[1] + d[1]} ${TL[0] + d[0]},${TL[1] + d[1]} ${TL[0]},${TL[1]}`;
  const top = `${TL[0]},${TL[1]} ${TR[0]},${TR[1]} ${TR[0] + d[0]},${TR[1] + d[1]} ${TL[0] + d[0]},${TL[1] + d[1]}`;

  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  const band = (t0: number, t1: number) => {
    const a = lerp(TL, FL, t0);
    const b = lerp(TR, FR, t0);
    const c = lerp(TR, FR, t1);
    const d0 = lerp(TL, FL, t1);
    return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d0[0]},${d0[1]}`;
  };

  const aPos: [number, number] = [(TL[0] + TR[0]) / 2 + d[0] * 0.15, Math.min(TL[1], TR[1]) - 16];
  const bPos: [number, number] = [FL[0] + d[0] - 28, (TL[1] + FL[1]) / 2 + d[1] * 0.3];
  const cPos: [number, number] = [
    (FL[0] + FL[0] + d[0]) / 2 - 8,
    FL[1] + d[1] * 0.2 + 22,
  ];

  return (
    <svg
      className="tg-diagram"
      viewBox="40 0 380 260"
      role="img"
      aria-label="Foil pack dimensions diagram"
    >
      <polygon points={side} className="tg-foil-side" />
      <polygon points={top} className="tg-foil-top" />
      <polygon points={face} className="tg-foil-face" />
      <polygon points={band(0.08, 0.18)} className="tg-foil-band" />
      <polygon points={band(0.82, 0.92)} className="tg-foil-band" />
      {[0.1, 0.13, 0.16, 0.84, 0.87, 0.9].map((t) => {
        const p0 = lerp(TL, FL, t);
        const p1 = lerp(TR, FR, t);
        return (
          <line
            key={t}
            x1={p0[0]}
            y1={p0[1]}
            x2={p1[0]}
            y2={p1[1]}
            className="tg-foil-rule"
          />
        );
      })}
      <g className="tg-foil-edges">
        <polygon points={side} fill="none" />
        <polygon points={top} fill="none" />
        <polygon points={face} fill="none" />
      </g>
      <text x={aPos[0]} y={aPos[1]} textAnchor="middle" className="tg-diagram-label">
        {la} (width)
      </text>
      <text
        x={bPos[0]}
        y={bPos[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        className="tg-diagram-label"
      >
        {lb} (height)
      </text>
      <text x={cPos[0]} y={cPos[1]} textAnchor="middle" className="tg-diagram-label">
        {lc} (depth)
      </text>
    </svg>
  );
}

function PlayerMatDiagram({
  x,
  y,
  radius,
  yLabel = 'height',
}: {
  x: string;
  y: string;
  radius: string;
  yLabel?: 'height' | 'length';
}) {
  const lx = x.trim() ? `${x} mm` : 'X mm';
  const ly = y.trim() ? `${y} mm` : 'Y mm';
  const lr = radius.trim() ? `${radius} mm` : 'R mm';
  const w = parseDim(x);
  const h = parseDim(y);
  const rad = parseDim(radius);

  const BL = [96, 150] as const;
  const BR = [258, 184] as const;
  const TL = [134, 74] as const;
  const TR = [296, 108] as const;

  const cutFrom = (
    from: readonly [number, number],
    toward: readonly [number, number],
    dist: number,
  ) => {
    const dx = toward[0] - from[0];
    const dy = toward[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(dist / len, 0.42);
    return [from[0] + dx * t, from[1] + dy * t] as [number, number];
  };

  const edge = Math.min(
    Math.hypot(BR[0] - BL[0], BR[1] - BL[1]),
    Math.hypot(TR[0] - BR[0], TR[1] - BR[1]),
  );
  const span = Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0 ? Math.min(w, h) : 300;
  const rFrac = !Number.isFinite(rad)
    ? 0.12
    : rad <= 0
      ? 0
      : Math.min(0.42, rad / span);
  const rPx = edge * rFrac;

  const pts = [BL, BR, TR, TL] as const;
  let d = '';
  pts.forEach((cur, i) => {
    const prev = pts[(i + 3) % 4];
    const next = pts[(i + 1) % 4];
    const a = cutFrom(cur, prev, rPx);
    const b = cutFrom(cur, next, rPx);
    d += i === 0 ? `M ${a[0]} ${a[1]} ` : `L ${a[0]} ${a[1]} `;
    d += `Q ${cur[0]} ${cur[1]} ${b[0]} ${b[1]} `;
  });
  d += 'Z';

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
  const rAlong = cutFrom(BR, BL, rPx * 0.55);
  const rOut = cutFrom(BR, TR, rPx * 0.55);
  const rLabel = [
    BR[0] + (BR[0] - TL[0]) * 0.08,
    BR[1] + (BR[1] - TL[1]) * 0.08 + 10,
  ];

  return (
    <svg
      className="tg-diagram"
      viewBox="40 48 340 180"
      role="img"
      aria-label="Player mat dimensions diagram"
    >
      <path d={d} className="tg-mat-face" />
      <path d={d} className="tg-board-edge" fill="none" />
      {rPx > 0 ? (
        <path
          d={`M ${rAlong[0]} ${rAlong[1]} Q ${BR[0]} ${BR[1]} ${rOut[0]} ${rOut[1]}`}
          className="tg-mat-radius"
          fill="none"
        />
      ) : null}
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
        {ly} ({yLabel})
      </text>
      <text
        x={rLabel[0]}
        y={rLabel[1]}
        textAnchor="middle"
        className="tg-diagram-label"
      >
        {lr} (radius)
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

const DICE_ICON_SRC: Record<
  Exclude<DiceTemplateFile['id'], 'all'>,
  string
> = {
  d4: 'https://images.wangsanshui.com/images/1788272329373-uiovno.png',
  d6: 'https://images.wangsanshui.com/images/1788272329367-yfzf53.png',
  d8: 'https://images.wangsanshui.com/images/1788272329356-lwa1uc.png',
  d10: 'https://images.wangsanshui.com/images/1788272329362-gfz8xb.png',
  d12: 'https://images.wangsanshui.com/images/1788272329146-kstubc.png',
  d20: 'https://images.wangsanshui.com/images/1788272329220-zxdvc7.png',
};

function DiceFaceIcon({ kind }: { kind: DiceTemplateFile['id'] }) {
  if (kind === 'all') return null;
  return (
    <img
      src={DICE_ICON_SRC[kind]}
      alt=""
      width={52}
      height={52}
      decoding="async"
      draggable={false}
    />
  );
}

async function downloadFixedPdf(file: DiceTemplateFile) {
  const href = toolsDownloadHref(file.fileUrl, file.fileName);
  const res = await fetch(href);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = file.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
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
  if (id === 'player-mat') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="10"
          y="8"
          width="44"
          height="32"
          rx="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (id === 'neoprene-mat') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="10"
          y="8"
          width="44"
          height="32"
          rx="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="12"
          width="36"
          height="24"
          rx="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
      </svg>
    );
  }
  if (id === 'rules-booklet') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="6"
          y="10"
          width="24"
          height="28"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="34"
          y="10"
          width="24"
          height="28"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M32 10 V38"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      </svg>
    );
  }
  if (id === 'magnetic-box') {
    return (
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M511.95392 953.67168c-2.26304 0-4.51584-0.6656-6.45632-1.99168L90.3424 669.0816a11.4688 11.4688 0 0 1-5.01248-9.48224V369.50528a11.45344 11.45344 0 0 1 17.91488-9.47712l415.15008 282.5984c3.13856 2.13504 5.01248 5.67808 5.01248 9.472v290.10944a11.47392 11.47392 0 0 1-11.45344 11.46368z m-403.69664-300.12928l392.22784 266.99776v-262.36928L108.25728 391.17312v262.36928z"
          fill="#0059a5"
        />
        <path
          d="M511.95392 953.67168c-2.26304 0-4.51584-0.6656-6.45632-1.99168L90.3424 669.0816a11.4688 11.4688 0 0 1-5.01248-9.48224V369.50528a11.45344 11.45344 0 0 1 17.91488-9.47712l415.15008 282.5984c3.13856 2.13504 5.01248 5.67808 5.01248 9.472v290.10944a11.47392 11.47392 0 0 1-11.45344 11.46368z m-403.69664-300.12928l392.22784 266.99776v-262.36928L108.25728 391.17312v262.36928z"
          fill="#0059a5"
        />
        <path
          d="M454.25664 843.40224l-299.77088-202.69056V468.31104l299.77088 202.68544zM511.95392 953.67168a11.45344 11.45344 0 0 1-11.46368-11.46368v-290.10944c0-3.7888 1.87904-7.33696 5.01248-9.472l415.15008-282.5984a11.45344 11.45344 0 0 1 17.90976 9.47712v290.09408c0 3.79904-1.8688 7.3472-5.00224 9.48224l-415.16032 282.5984a11.40736 11.40736 0 0 1-6.44608 1.99168z m11.45856-295.5008v262.36928l392.22784-266.99776V391.17312l-392.22784 266.99776z"
          fill="#0059a5"
        />
        <path
          d="M511.95392 662.00576c-2.25792 0-4.51072-0.6656-6.45632-1.99168L90.3424 377.41056a11.47904 11.47904 0 0 1 0.0256-18.97472l302.46912-204.82048-91.12064-62.3616a11.4688 11.4688 0 0 1-4.44928-12.93824 11.6224 11.6224 0 0 1 11.10528-7.9872l202.47552 3.24608c2.24768 0.03584 4.43904 0.73728 6.28736 2.00192l204.18048 139.74528 212.34176 144.5376a11.4688 11.4688 0 0 1-0.0256 18.9696l-415.25248 281.20064a11.43808 11.43808 0 0 1-6.4256 1.97632z m-394.752-294.0416l394.76224 268.71808 394.83904-267.3664-198.41024-135.05536-201.35424-137.81504-160.91136-2.58048 73.55392 50.34496a11.4688 11.4688 0 0 1-0.04096 18.95424l-302.4384 204.8z"
          fill="#0059a5"
        />
        <path
          d="M934.83008 366.09024l-415.16032-282.60352 414.03904 283.37664zM731.43808 363.75552L417.72032 143.0784 319.65696 221.08672l415.1552 282.60352 198.7072-136.69376z"
          fill="#0059a5"
        />
      </svg>
    );
  }
  if (id === 'tuckbox') {
    return (
      <svg viewBox="0 0 64 48">
        <path
          d="M18 16 H46 V40 H18 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M18 16 L24 8 H40 L46 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M32 16 V40" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2" />
      </svg>
    );
  }
  if (id === 'foil-pack') {
    return (
      <svg viewBox="0 0 64 48">
        <path
          d="M18 42 L18 10 L40 6 L40 38 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M18 10 L12 6 L12 34 L18 42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M12 6 L34 2 L40 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (id === 'dice') {
    return (
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M848.8 234.4l-265-153c-38.5-22.3-105.1-22.3-143.6 0l-265 153c-39.6 22.8-71.8 78.6-71.8 124.3v306c0 45.7 32.2 101.5 71.8 124.3l265 153c19.3 11.1 44.7 17.3 71.8 17.3 27 0 52.5-6.1 71.8-17.3l265-153c39.6-22.8 71.8-78.6 71.8-124.3v-306c0-45.7-32.2-101.5-71.8-124.3zM491.1 864.7c0 9.2-2 16.8-5.6 21.3-2.7 3.3-6.1 4.9-10.9 4.9-5.3 0-11.7-2.1-18.5-6l-244.2-141c-28.6-16.5-52.8-58.4-52.8-91.4V395.3c0-7.9 1.6-26.2 16.5-26.2 5.3 0 11.7 2.1 18.5 6l244.2 141c28.6 16.5 52.8 58.4 52.8 91.4v257.2z m20.8-392c-20 0-39.2-4.5-52.8-12.3l-244.2-141c-10.5-6.1-16.6-13.4-16.6-20.2 0-6.8 6-14.1 16.6-20.2l244.2-141c13.5-7.8 32.8-12.3 52.8-12.3s39.2 4.5 52.8 12.3l244.2 141c10.5 6.1 16.5 13.4 16.5 20.2 0 6.8-6 14.1-16.5 20.2l-244.2 141c-13.6 7.8-32.8 12.3-52.8 12.3z m349.7 179.7c0 33-24.2 74.9-52.8 91.4L591.7 869.6l-18.5 6c-14.9 0-16.5-18.3-16.5-26.2V592.3c0-33 24.2-74.9 52.8-91.4l217.1-125.8c6.8-3.9 13.2-6 18.5-6 14.9 0 16.5 18.3 16.5 26.2v257.1z"
          fill="#0059a5"
        />
        <path
          d="M239.9 470.7c-18.9 0-34.3 20.6-34.3 45.9 0 25.3 15.4 45.9 34.3 45.9s34.3-20.6 34.3-45.9c0-25.3-15.4-45.9-34.3-45.9zM239.9 626.7c-18.9 0-34.3 20.6-34.3 45.9 0 25.3 15.4 45.9 34.3 45.9s34.3-20.6 34.3-45.9c0-25.3-15.4-45.9-34.3-45.9zM371.8 693.1c-18.9 0-34.3 20.6-34.3 45.9 0 25.3 15.4 45.9 34.3 45.9s34.3-20.6 34.3-45.9c0-25.3-15.4-45.9-34.3-45.9zM667.5 553.9c-18.9 0-34.3 20.6-34.3 45.9 0 25.3 15.4 45.9 34.3 45.9s34.3-20.6 34.3-45.9c0-25.3-15.3-45.9-34.3-45.9zM777.7 603.1c-18.9 0-34.3 20.6-34.3 45.9s15.4 45.9 34.3 45.9S812 674.3 812 649c0-25.3-15.3-45.9-34.3-45.9zM510.5 262.7c-27.8 0-50.4 15.4-50.4 34.3s22.6 34.3 50.4 34.3c27.8 0 50.4-15.4 50.4-34.3s-22.6-34.3-50.4-34.3zM383.5 540.1c-18.9 0-34.3 20.6-34.3 45.9 0 25.3 15.4 45.9 34.3 45.9 9.6 0 18.8-5.4 25.3-14.9 5.8-8.5 9-19.5 9-30.9 0-25.4-15.4-46-34.3-46z"
          fill="#0059a5"
        />
      </svg>
    );
  }
  if (id === 'tin-box') {
    return (
      <svg viewBox="0 0 64 48">
        <rect
          x="10"
          y="14"
          width="44"
          height="26"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M10 22 H54" stroke="currentColor" strokeWidth="2" />
        <path
          d="M22 14 V10 H42 V14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
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

export function TemplateGeneratorApp({
  diceItems = [],
  diceAll = null,
}: {
  diceItems?: DiceTemplateFile[];
  diceAll?: DiceTemplateFile | null;
}) {
  const [template, setTemplate] = useState<TemplateId>(
    DEV_AUTO_MAGNETIC ? 'magnetic-box' : 'two-piece-box',
  );
  const [x, setX] = useState(DEV_AUTO_MAGNETIC ? String(AUTO_MAGNETIC_DEFAULTS.a) : '');
  const [y, setY] = useState(DEV_AUTO_MAGNETIC ? String(AUTO_MAGNETIC_DEFAULTS.b) : '');
  const [z, setZ] = useState(DEV_AUTO_MAGNETIC ? String(AUTO_MAGNETIC_DEFAULTS.c) : '');
  const [material, setMaterial] = useState<BoxMaterialMm | ''>('');
  const [magThickness, setMagThickness] = useState<MagneticThicknessMm | ''>(
    DEV_AUTO_MAGNETIC ? AUTO_MAGNETIC_DEFAULTS.thickness : '',
  );
  const [fold, setFold] = useState<BoardFoldId>('half-h');
  const [doubleSided, setDoubleSided] = useState(false);
  const [cardMode, setCardMode] = useState<'standard' | 'custom'>('standard');
  const [cardSizeId, setCardSizeId] = useState(DEFAULT_CARD_SIZE_ID);
  const [radius, setRadius] = useState('');
  const [neoRadius, setNeoRadius] = useState(DEFAULT_NEOPRENE_RADIUS);
  const [stitched, setStitched] = useState(false);
  const [outside, setOutside] = useState('0');
  const [spine, setSpine] = useState('0');
  const [depthMode, setDepthMode] = useState<'custom' | 'cards'>('custom');
  const [cardQty, setCardQty] = useState('');
  const [cardStock, setCardStock] = useState<CardStockId | 'custom' | ''>('');
  const [customCardMm, setCustomCardMm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shouldAutoOpenMagneticBox()) return;
    void openMagneticBoxPdf(AUTO_MAGNETIC_DEFAULTS).catch((err) => {
      console.error(err);
    });
  }, []);

  const isBox = template === 'two-piece-box';
  const isMagnetic = template === 'magnetic-box';
  const isPunchboard = template === 'punchboard';
  const isCards = template === 'cards';
  const isPaperPad = template === 'paper-pad';
  const isPaperSheet = template === 'paper-sheet';
  const isPlayerMat = template === 'player-mat';
  const isNeoprene = template === 'neoprene-mat';
  const isBooklet = template === 'rules-booklet';
  const isTuckbox = template === 'tuckbox';
  const isFoilPack = template === 'foil-pack';
  const isDice = template === 'dice';
  const isTinBox = template === 'tin-box';
  const isCardDepth = isTuckbox || isFoilPack;
  const isXyOnly = isPunchboard || isPaperPad;
  const sheetFold: SheetFoldId = fold === 'sixth' ? 'half-h' : fold;
  const selectedCard = getCardSize(cardSizeId);
  const cardW = cardMode === 'standard' ? selectedCard.w : parseDim(x);
  const cardH = cardMode === 'standard' ? selectedCard.h : parseDim(y);

  const tuckCardThickness = useMemo(() => {
    if (cardStock === 'custom') return parseDim(customCardMm);
    if (cardStock === '') return NaN;
    return cardStockMm(cardStock);
  }, [cardStock, customCardMm]);

  const tuckDepth = useMemo(() => {
    if (depthMode === 'custom') return parseDim(z);
    return tuckboxDepthFromCards(parseDim(cardQty), tuckCardThickness);
  }, [depthMode, z, cardQty, tuckCardThickness]);

  const folded = useMemo(() => {
    const dx = parseDim(x);
    const dy = parseDim(y);
    if (!(dx > 0) || !(dy > 0)) return null;
    return foldedBoardSize(dx, dy, isPaperSheet ? sheetFold : fold);
  }, [x, y, fold, isPaperSheet, sheetFold]);

  const valid = useMemo(() => {
    if (isDice) return diceItems.length > 0 || Boolean(diceAll?.fileUrl);
    const dx = parseDim(x);
    const dy = parseDim(y);
    if (isBox) {
      const dz = parseDim(z);
      return material !== '' && dx > 0 && dy > 0 && dz > 0;
    }
    if (isMagnetic) {
      const dz = parseDim(z);
      return magThickness !== '' && dx > 0 && dy > 0 && dz > 0;
    }
    if (isTinBox) {
      const dz = parseDim(z);
      const dr = parseDim(radius);
      return dx > 0 && dy > 0 && dz > 0 && dr >= 0 && dr <= Math.min(dx, dy) / 2;
    }
    if (isCards) {
      return cardW > 0 && cardH > 0;
    }
    if (isPlayerMat) {
      const dr = parseDim(radius);
      return dx > 0 && dy > 0 && dr >= 0 && dr <= Math.min(dx, dy) / 2;
    }
    if (isBooklet) {
      const dout = outside.trim() === '' ? 0 : parseDim(outside);
      const dspine = spine.trim() === '' ? 0 : parseDim(spine);
      if (!(dx > 0) || !(dy > 0) || !(dout >= 0) || !(dspine >= 0)) return false;
      const { out, sp } = bookletInsets(dout, dspine);
      return dx - out - sp > 0 && dy - 2 * out > 0;
    }
    if (isTuckbox || isFoilPack) {
      return dx > 0 && dy > 0 && tuckDepth > 0;
    }
    return dx > 0 && dy > 0;
  }, [
    isDice,
    isTinBox,
    diceItems,
    diceAll,
    isBox,
    isMagnetic,
    isCards,
    isPlayerMat,
    isBooklet,
    isTuckbox,
    isFoilPack,
    x,
    y,
    z,
    material,
    magThickness,
    cardW,
    cardH,
    radius,
    outside,
    spine,
    tuckDepth,
  ]);

  const onDiceDownload = async (file: DiceTemplateFile) => {
    setError('');
    setBusy(true);
    try {
      await downloadFixedPdf(file);
    } catch (err) {
      console.error(err);
      setError('Could not download the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    setError('');
    if (isDice) {
      if (!diceAll) {
        setError('Dice templates are not available yet.');
        return;
      }
      await onDiceDownload(diceAll);
      return;
    }
    if (!valid) {
      setError(
        isBox
          ? 'Enter X / Y / Z and choose a material.'
          : isMagnetic
            ? 'Enter A / B / C and choose a thickness.'
            : isTinBox
              ? 'Enter A / B / C and a corner radius (0 to half of the shorter side).'
            : isTuckbox || isFoilPack
              ? 'Enter width / height and a depth (custom or cards qty).'
            : isPlayerMat
            ? 'Enter X / Y and a corner radius (0 to half of the shorter side).'
            : isBooklet
              ? 'Enter page width / height. Margins must fit inside the page (use 0 if unsure).'
              : isCards
            ? 'Enter X / Y or choose a standard size.'
            : 'Enter X / Y.',
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
      } else if (isMagnetic) {
        await downloadMagneticBoxPdf({
          a: parseDim(x),
          b: parseDim(y),
          c: parseDim(z),
          thickness: magThickness as MagneticThicknessMm,
        });
      } else if (isTinBox) {
        await downloadTinBoxPdf({
          a: parseDim(x),
          b: parseDim(y),
          c: parseDim(z),
          radius: parseDim(radius),
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
      } else if (isPlayerMat) {
        await downloadPlayerMatPdf({
          x: parseDim(x),
          y: parseDim(y),
          radius: parseDim(radius),
        });
      } else if (isNeoprene) {
        await downloadNeopreneMatPdf({
          x: parseDim(x),
          y: parseDim(y),
          radius: neoRadius,
          stitched,
        });
      } else if (isBooklet) {
        await downloadRulesBookletPdf({
          x: parseDim(x),
          y: parseDim(y),
          outside: outside.trim() === '' ? 0 : parseDim(outside),
          spine: spine.trim() === '' ? 0 : parseDim(spine),
        });
      } else if (isTuckbox) {
        await downloadTuckboxPdf({
          x: parseDim(x),
          y: parseDim(y),
          z: tuckDepth,
          cards: depthMode === 'cards' ? parseDim(cardQty) : undefined,
        });
      } else if (isFoilPack) {
        await downloadFoilPackPdf({
          x: parseDim(x),
          y: parseDim(y),
          z: tuckDepth,
          cards: depthMode === 'cards' ? parseDim(cardQty) : undefined,
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
    } catch (err) {
      console.error(err);
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
            <span>2</span>{' '}
            {isDice ? 'Choose a dice template' : 'Enter your dimensions'}
          </h2>
          {isDice ? (
            <div className="tg-dice-panel">
              <p className="tg-dice-lead">
                Click the dice template(s) you want to download
              </p>
              <div className="tg-dice-row">
                {diceItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="tg-dice-item"
                    disabled={busy || !item.fileUrl}
                    onClick={() => onDiceDownload(item)}
                  >
                    <span className="tg-dice-icon" aria-hidden>
                      <DiceFaceIcon kind={item.id} />
                    </span>
                    <span className="tg-dice-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : isTinBox ? (
            <div className="tg-dims">
              <BoxDiagram
                x={x}
                y={y}
                z={z}
                xName="A"
                yName="B"
                zName="C"
                yLabel="height"
                zLabel="depth"
              />
              <div className="tg-fields">
                <label className="tg-field">
                  <span>A mm (width)</span>
                  <input
                    inputMode="decimal"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </label>
                <label className="tg-field">
                  <span>B mm (height)</span>
                  <input
                    inputMode="decimal"
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </label>
                <label className="tg-field">
                  <span>C mm (depth)</span>
                  <input
                    inputMode="decimal"
                    value={z}
                    onChange={(e) => setZ(e.target.value)}
                    placeholder="e.g. 20"
                  />
                </label>
                <label className="tg-field">
                  <span>Corner radius mm</span>
                  <input
                    inputMode="decimal"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    placeholder="e.g. 20"
                  />
                </label>
              </div>
            </div>
          ) : isCards ? (
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
              {isBox || isMagnetic ? (
                <BoxDiagram
                  x={x}
                  y={y}
                  z={z}
                  {...(isMagnetic
                    ? {
                        xName: 'A',
                        yName: 'B',
                        zName: 'C',
                        yLabel: 'height',
                        zLabel: 'depth',
                      }
                    : {})}
                />
              ) : isTuckbox || isFoilPack ? (
                <FoilPackDiagram
                  x={x}
                  y={y}
                  z={depthMode === 'cards' ? (tuckDepth > 0 ? String(tuckDepth) : '') : z}
                />
              ) : isPunchboard ? (
                <PunchboardDiagram x={x} y={y} />
              ) : isPaperPad ? (
                <PaperPadDiagram x={x} y={y} />
              ) : isPaperSheet ? (
                <PaperSheetDiagram x={x} y={y} fold={sheetFold} />
              ) : isPlayerMat ? (
                <PlayerMatDiagram x={x} y={y} radius={radius} />
              ) : isNeoprene ? (
                <PlayerMatDiagram
                  x={x}
                  y={y}
                  radius={String(neoRadius)}
                  yLabel="length"
                />
              ) : isBooklet ? (
                <BookletDiagram x={x} y={y} />
              ) : (
                <BoardDiagram x={x} y={y} fold={fold} />
              )}
              <div className="tg-fields">
                <label className="tg-field">
                  <span>
                    {isMagnetic || isCardDepth
                      ? 'A mm (width)'
                      : `X mm (${isBooklet ? 'width per page' : 'width'})`}
                  </span>
                  <input
                    inputMode="decimal"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                    placeholder={isMagnetic || isCardDepth ? 'e.g. 100' : 'e.g. 150'}
                  />
                </label>
                <label className="tg-field">
                  <span>
                    {isMagnetic || isCardDepth
                      ? 'B mm (height)'
                      : `Y mm (${isBox || isNeoprene ? 'length' : 'height'})`}
                  </span>
                  <input
                    inputMode="decimal"
                    value={y}
                    onChange={(e) => setY(e.target.value)}
                    placeholder={isMagnetic || isCardDepth ? 'e.g. 100' : 'e.g. 150'}
                  />
                </label>

                {isBox || isMagnetic ? (
                  <>
                    <label className="tg-field">
                      <span>{isMagnetic ? 'C mm (depth)' : 'Z mm (height)'}</span>
                      <input
                        inputMode="decimal"
                        value={z}
                        onChange={(e) => setZ(e.target.value)}
                        placeholder={isMagnetic ? 'e.g. 20' : 'e.g. 50'}
                      />
                    </label>
                    {isMagnetic ? (
                      <label className="tg-field">
                        <span>D Thickness</span>
                        <select
                          value={magThickness}
                          onChange={(e) =>
                            setMagThickness(
                              e.target.value
                                ? (Number(e.target.value) as MagneticThicknessMm)
                                : '',
                            )
                          }
                        >
                          <option value="">- Select -</option>
                          {MAGNETIC_THICKNESSES.map((item) => (
                            <option key={item.mm} value={item.mm}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
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
                    )}
                  </>
                ) : isCardDepth ? (
                  <>
                    <label className="tg-field">
                      <span>Depth</span>
                      <select
                        value={depthMode}
                        onChange={(e) =>
                          setDepthMode(e.target.value === 'cards' ? 'cards' : 'custom')
                        }
                      >
                        <option value="custom">Custom</option>
                        <option value="cards">Cards qty</option>
                      </select>
                    </label>
                    {depthMode === 'custom' ? (
                      <label className="tg-field">
                        <span>C mm (depth)</span>
                        <input
                          inputMode="decimal"
                          value={z}
                          onChange={(e) => setZ(e.target.value)}
                          placeholder="e.g. 20"
                        />
                      </label>
                    ) : (
                      <>
                        <label className="tg-field">
                          <span>Cards qty</span>
                          <input
                            inputMode="decimal"
                            value={cardQty}
                            onChange={(e) => setCardQty(e.target.value)}
                            placeholder="e.g. 54"
                          />
                        </label>
                        <label className="tg-field">
                          <span>Thickness</span>
                          <select
                            value={cardStock}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '' || v === 'custom') {
                                setCardStock(v);
                              } else {
                                setCardStock(v as CardStockId);
                              }
                            }}
                          >
                            <option value="">- Select -</option>
                            {CARD_STOCKS.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                            <option value="custom">custom</option>
                          </select>
                        </label>
                        {cardStock === 'custom' ? (
                          <label className="tg-field">
                            <span>Thickness mm</span>
                            <input
                              inputMode="decimal"
                              value={customCardMm}
                              onChange={(e) => setCustomCardMm(e.target.value)}
                              placeholder="e.g. 0.30"
                            />
                          </label>
                        ) : null}
                        <div className="tg-folded">
                          <span>Depth</span>
                          <strong>
                            @ {tuckDepth > 0 ? `${formatFolded(tuckDepth)} mm` : '0 mm'}
                          </strong>
                        </div>
                      </>
                    )}
                  </>
                ) : isPlayerMat ? (
                  <label className="tg-field">
                    <span>Corner radius mm</span>
                    <input
                      inputMode="decimal"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      placeholder="e.g. 20"
                    />
                  </label>
                ) : isNeoprene ? (
                  <>
                    <label className="tg-field">
                      <span>Corner radius</span>
                      <select
                        value={neoRadius}
                        onChange={(e) => setNeoRadius(Number(e.target.value))}
                      >
                        {NEOPRENE_RADII.map((item) => (
                          <option key={item.mm} value={item.mm}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="tg-check">
                      <input
                        type="checkbox"
                        checked={stitched}
                        onChange={(e) => setStitched(e.target.checked)}
                      />
                      <span>Stitched edges</span>
                    </label>
                  </>
                ) : isBooklet ? (
                  <>
                    <label className="tg-field">
                      <span>Outside margin mm</span>
                      <input
                        inputMode="decimal"
                        value={outside}
                        onChange={(e) => setOutside(e.target.value)}
                        placeholder="e.g. 0"
                      />
                    </label>
                    <label className="tg-field">
                      <span>Spine margin mm</span>
                      <input
                        inputMode="decimal"
                        value={spine}
                        onChange={(e) => setSpine(e.target.value)}
                        placeholder="e.g. 0"
                      />
                    </label>
                    <p className="tg-hint">If you are unsure, input 0.</p>
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
            <span>3</span>{' '}
            {isDice ? 'Download all templates' : 'Download your template'}
          </h2>
          <button
            type="button"
            className={`btn btn-primary tg-download${isDice ? ' tg-download-all' : ''}`}
            disabled={busy || (isDice && !diceAll)}
            onClick={onDownload}
          >
            {busy
              ? 'Downloading…'
              : isDice
                ? 'DOWNLOAD ALL'
                : 'Download PDF'}
          </button>
          {error ? <p className="tg-error">{error}</p> : null}
        </li>
      </ol>
    </div>
  );
}
