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

const TEMPLATES = [
  { id: 'two-piece-box', label: 'Two Piece Game Box' },
  { id: 'game-board', label: 'Game Board' },
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isBox = template === 'two-piece-box';
  const isBoard = template === 'game-board';

  const folded = useMemo(() => {
    const dx = parseDim(x);
    const dy = parseDim(y);
    if (!(dx >= 10) || !(dy >= 10)) return null;
    return foldedBoardSize(dx, dy, fold);
  }, [x, y, fold]);

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
    return dx >= 10 && dy >= 10 && dx <= 1200 && dy <= 1200;
  }, [isBox, x, y, z, material]);

  const onDownload = async () => {
    setError('');
    if (!valid) {
      setError(
        isBox
          ? 'Enter X / Y / Z (10–600 mm) and choose a material.'
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
          <div className="tg-dims">
            {isBox ? (
              <BoxDiagram x={x} y={y} z={z} />
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
                <span>Y mm ({isBoard ? 'height' : 'length'})</span>
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
              ) : (
                <>
                  <label className="tg-field">
                    <span>Folds</span>
                    <select
                      value={fold}
                      onChange={(e) => setFold(e.target.value as BoardFoldId)}
                    >
                      {BOARD_FOLDS.map((item) => (
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
                  <label className="tg-check">
                    <input
                      type="checkbox"
                      checked={doubleSided}
                      onChange={(e) => setDoubleSided(e.target.checked)}
                    />
                    <span>Double Sided</span>
                  </label>
                </>
              )}
            </div>
          </div>
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
