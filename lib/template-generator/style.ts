import type { jsPDF } from 'jspdf';
import { foldLines, type FoldId } from './folds';

/** 工艺尺寸（mm），各模板共用 */
export const BLEED = 3;
export const SAFE = 3;
export const WRAP = 15;
export const PAD = 40;
export const HEADER = 32;

export const HEADER_INSET = 10;
export const LEGEND_W = 52;
export const HEADER_LEGEND_GAP = 24;

export type Cmyk = readonly [number, number, number, number];
export type GuideKind = 'margin' | 'dieline' | 'bleed';

/**
 * 刀线视觉参数。改这里，Box / Board / Punchboard / Cards 一起变。
 * 绿虚线 Margin / 品红实线 Fold/Dieline / 青虚线 Outer Bleed
 */
export const GUIDE_WIDTH = 0.3;
export const DASH_ON = 1.6;
export const DASH_OFF = 1.1;
export const LEGEND_SWATCH_WIDTH = 0.9;

export const GUIDE = {
  margin: { color: [1, 0, 1, 0] as const, dashed: true },
  dieline: { color: [0, 1, 1, 0] as const, dashed: false },
  bleed: { color: [1, 0.55, 0, 0] as const, dashed: true },
} as const;

export function strokeGuide(doc: jsPDF, kind: GuideKind, width = GUIDE_WIDTH) {
  const g = GUIDE[kind];
  doc.setDrawColor(g.color[0], g.color[1], g.color[2], g.color[3]);
  doc.setLineWidth(width);
  doc.setLineDashPattern(g.dashed ? [DASH_ON, DASH_OFF] : [], 0);
}

/** 矩形成品：外出血 / 裁切 / 安全边，各平面模板共用 */
export function drawRectGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  strokeGuide(doc, 'bleed');
  doc.rect(x - BLEED, y - BLEED, w + 2 * BLEED, h + 2 * BLEED);

  strokeGuide(doc, 'dieline');
  doc.rect(x, y, w, h);

  if (w > SAFE * 2 && h > SAFE * 2) {
    strokeGuide(doc, 'margin');
    doc.rect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE);
  }
}

export function drawFoldGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fold: FoldId,
) {
  const lines = foldLines(x, y, w, h, fold);
  if (!lines.length) return;
  strokeGuide(doc, 'dieline');
  lines.forEach((ln) => doc.line(ln.x1, ln.y1, ln.x2, ln.y2));
}

export function clampCornerRadius(w: number, h: number, radius: number) {
  if (!Number.isFinite(radius) || radius <= 0) return 0;
  return Math.min(radius, w / 2, h / 2);
}

/** 圆角成品：外出血 / 裁切 / 安全边 */
export function drawRoundedGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  safe = SAFE,
) {
  const r = clampCornerRadius(w, h, radius);
  const inset = Number.isFinite(safe) && safe > 0 ? safe : SAFE;
  const bleedR = r > 0 ? r + BLEED : 0;

  strokeGuide(doc, 'bleed');
  doc.roundedRect(
    x - BLEED,
    y - BLEED,
    w + 2 * BLEED,
    h + 2 * BLEED,
    bleedR,
    bleedR,
    'S',
  );

  strokeGuide(doc, 'dieline');
  doc.roundedRect(x, y, w, h, r, r, 'S');

  if (w > inset * 2 && h > inset * 2) {
    const ir = Math.max(0, r - inset);
    strokeGuide(doc, 'margin');
    doc.roundedRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, ir, ir, 'S');
  }
}
