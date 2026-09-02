import type { jsPDF } from 'jspdf';
import {
  type GuideKind,
  HEADER_INSET,
  HEADER_LEGEND_GAP,
  LEGEND_SWATCH_WIDTH,
  LEGEND_W,
  strokeGuide,
} from './style';

const LOGO_SRC = '/images/logo-2.png';
/** 与加大后的三行标题齐高 */
export const LOGO_W = 26;
export const LOGO_H = (26 * 216) / 211;

let cached: string | null = null;

/** 4-bit 索引 PNG jsPDF 解不开，先转成标准 RGBA PNG */
export async function loadLogoDataUrl() {
  if (cached) return cached;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not load PDF logo'));
    el.src = LOGO_SRC;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw PDF logo');
  ctx.drawImage(img, 0, 0);

  cached = canvas.toDataURL('image/png');
  return cached;
}

export function ink(doc: jsPDF) {
  doc.setTextColor(0, 0, 0, 1);
  doc.setDrawColor(0, 0, 0, 1);
  doc.setLineDashPattern([], 0);
}

function extraLines(extra?: string | string[]) {
  if (!extra) return [];
  const lines = Array.isArray(extra) ? extra : [extra];
  return lines.map((line) => line.trim()).filter(Boolean);
}

function headerTextWidth(
  doc: jsPDF,
  title: string,
  subtitle: string,
  extra?: string | string[],
) {
  const extras = extraLines(extra);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  let textW = doc.getTextWidth(title);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  textW = Math.max(textW, doc.getTextWidth(subtitle));
  extras.forEach((line) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    textW = Math.max(textW, doc.getTextWidth(line));
  });
  return textW;
}

export function headerBlockWidth(
  doc: jsPDF,
  title: string,
  subtitle: string,
  extra?: string | string[],
) {
  return LOGO_W + 6 + headerTextWidth(doc, title, subtitle, extra);
}

/** 页眉标题区 + 右侧图例所需的最小页宽 */
export function headerMinPageWidth(
  doc: jsPDF,
  title: string,
  subtitle: string,
  extra?: string | string[],
) {
  return (
    HEADER_INSET +
    headerBlockWidth(doc, title, subtitle, extra) +
    HEADER_LEGEND_GAP +
    LEGEND_W +
    8
  );
}

/** 页眉：兔子 logo + 标题。默认居中；窄页用 left，避免和图例重叠 */
export function drawHeader(
  doc: jsPDF,
  opts: {
    pageW: number;
    logoDataUrl: string;
    title: string;
    subtitle: string;
    extra?: string | string[];
    align?: 'center' | 'left';
  },
) {
  const extras = extraLines(opts.extra);
  const textW = headerTextWidth(doc, opts.title, opts.subtitle, opts.extra);
  const gap = 6;
  const blockW = LOGO_W + gap + textW;
  const x0 =
    opts.align === 'left'
      ? HEADER_INSET
      : (opts.pageW - blockW) / 2;
  const y0 = 5;

  doc.addImage(opts.logoDataUrl, 'PNG', x0, y0, LOGO_W, LOGO_H);

  const lineGap = 7.4;
  const textH = lineGap * (2 + extras.length);
  let ty = y0 + (LOGO_H - textH) / 2 + 5.2;
  const tx = x0 + LOGO_W + gap;

  ink(doc);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(opts.title, tx, ty);
  ty += lineGap;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(opts.subtitle, tx, ty);
  extras.forEach((line) => {
    ty += lineGap;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.text(line, tx, ty);
  });
}

export function drawLegend(doc: jsPDF, x: number, y: number) {
  const rows: { label: string; kind: GuideKind }[] = [
    { label: 'Margin', kind: 'margin' },
    { label: 'Fold/Dieline', kind: 'dieline' },
    { label: 'Outer Bleed', kind: 'bleed' },
  ];
  rows.forEach((row, i) => {
    const yy = y + i * 7;
    strokeGuide(doc, row.kind, LEGEND_SWATCH_WIDTH);
    doc.line(x, yy, x + 14, yy);
    ink(doc);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, x + 17, yy + 1.2);
  });
}
