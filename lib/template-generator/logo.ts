import type { jsPDF } from 'jspdf';

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

export type Cmyk = readonly [number, number, number, number];

/** 对照客户刀模图例：绿虚线 / 红实线 / 蓝虚线 */
export const LINE = {
  margin: [1, 0, 1, 0] as const,
  dieline: [0, 1, 1, 0] as const,
  bleed: [1, 0.55, 0, 0] as const,
};

export function stroke(
  doc: jsPDF,
  color: Cmyk,
  dashed = false,
  width = 0.25,
) {
  doc.setDrawColor(color[0], color[1], color[2], color[3]);
  doc.setLineWidth(width);
  doc.setLineDashPattern(dashed ? [4, 2.2] : [], 0);
}

export function ink(doc: jsPDF) {
  doc.setTextColor(0, 0, 0, 1);
  doc.setDrawColor(0, 0, 0, 1);
  doc.setLineDashPattern([], 0);
}

/** 页眉：兔子 logo + 标题作为一个整体水平居中 */
export function drawHeader(
  doc: jsPDF,
  opts: {
    pageW: number;
    logoDataUrl: string;
    title: string;
    subtitle: string;
    extra?: string;
  },
) {
  const extras = opts.extra?.trim() ? [opts.extra.trim()] : [];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  let textW = doc.getTextWidth(opts.title);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  textW = Math.max(textW, doc.getTextWidth(opts.subtitle));
  extras.forEach((line) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    textW = Math.max(textW, doc.getTextWidth(line));
  });

  const gap = 6;
  const blockW = LOGO_W + gap + textW;
  const x0 = (opts.pageW - blockW) / 2;
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
  const rows: { label: string; color: Cmyk; dashed?: boolean }[] = [
    { label: 'Margin', color: LINE.margin, dashed: true },
    { label: 'Fold/Dieline', color: LINE.dieline },
    { label: 'Outer Bleed', color: LINE.bleed, dashed: true },
  ];
  rows.forEach((row, i) => {
    const yy = y + i * 7;
    stroke(doc, row.color, !!row.dashed, 0.9);
    doc.line(x, yy, x + 14, yy);
    ink(doc);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, x + 17, yy + 1.2);
  });
}
