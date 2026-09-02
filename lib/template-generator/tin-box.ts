import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import {
  BLEED,
  clampCornerRadius,
  HEADER,
  LEGEND_W,
  PAD,
  SAFE,
  strokeGuide,
} from './style';

function formatMm(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** 圆角矩形周长（侧条展开长度） */
export function roundedRectPerimeter(w: number, h: number, radius: number) {
  const r = clampCornerRadius(w, h, radius);
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
}

export function tinBoxPdfFileName(a: number, b: number, c: number, r: number) {
  return `TinBox_${a}x${b}x${c}r${r}mm.pdf`;
}

function marginRounded(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  if (w <= SAFE * 2 || h <= SAFE * 2) return;
  const r = clampCornerRadius(w, h, radius);
  const ir = Math.max(0, r - SAFE);
  strokeGuide(doc, 'margin');
  doc.roundedRect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE, ir, ir, 'S');
}

function marginRect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  if (w <= SAFE * 2 || h <= SAFE * 2) return;
  strokeGuide(doc, 'margin');
  doc.rect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE);
}

/**
 * Top Part（对齐截图三块）：
 * 1. 外包纸：外框 (A+2C)×(B+2C)，内圆角顶面 A×B
 * 2. 顶面单独稿：A×B，内圆角安全线
 * 3. 侧条：周长 × C
 */
function drawTopPart(
  doc: jsPDF,
  a: number,
  b: number,
  c: number,
  radius: number,
  subtitle: string,
  logoDataUrl: string,
) {
  const r = clampCornerRadius(a, b, radius);
  const wrapW = a + 2 * c;
  const wrapH = b + 2 * c;
  const bandL = roundedRectPerimeter(a, b, r);
  const bandH = c;
  const gap = 12;

  const contentW = Math.max(wrapW + gap + a, bandL);
  const contentH = wrapH + gap + bandH;
  const title = 'Tin Box Template - Top Part';

  const pageW = Math.max(
    contentW + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle),
  );
  const pageH = HEADER + contentH + 2 * BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  drawHeader(doc, {
    pageW,
    logoDataUrl,
    title,
    subtitle,
  });
  drawLegend(doc, pageW - LEGEND_W, 9);

  const ox = (pageW - contentW) / 2;
  const oy = HEADER + BLEED;

  // 1) 外包纸：外矩形 + 内圆角顶面
  const wx = ox;
  const wy = oy;
  strokeGuide(doc, 'bleed');
  doc.rect(wx - BLEED, wy - BLEED, wrapW + 2 * BLEED, wrapH + 2 * BLEED);
  strokeGuide(doc, 'dieline');
  doc.rect(wx, wy, wrapW, wrapH);
  marginRect(doc, wx, wy, wrapW, wrapH);

  const ix = wx + c;
  const iy = wy + c;
  strokeGuide(doc, 'dieline');
  doc.roundedRect(ix, iy, a, b, r, r, 'S');
  marginRounded(doc, ix, iy, a, b, r);

  // 2) 顶面单独稿
  const fx = ox + wrapW + gap;
  const fy = oy + Math.max(0, (wrapH - b) / 2);
  strokeGuide(doc, 'bleed');
  doc.rect(fx - BLEED, fy - BLEED, a + 2 * BLEED, b + 2 * BLEED);
  strokeGuide(doc, 'dieline');
  doc.rect(fx, fy, a, b);
  marginRounded(doc, fx, fy, a, b, r);

  // 3) 侧条
  const sx = ox;
  const sy = oy + wrapH + gap;
  strokeGuide(doc, 'bleed');
  doc.rect(sx - BLEED, sy - BLEED, bandL + 2 * BLEED, bandH + 2 * BLEED);
  strokeGuide(doc, 'dieline');
  doc.rect(sx, sy, bandL, bandH);
  if (bandH > SAFE * 2) {
    strokeGuide(doc, 'margin');
    doc.line(sx + SAFE, sy + bandH - SAFE, sx + bandL - SAFE, sy + bandH - SAFE);
  }
}

export function generateTinBoxPdf(
  input: { a: number; b: number; c: number; radius: number },
  logoDataUrl: string,
) {
  const { a, b, c, radius } = input;
  const r = clampCornerRadius(a, b, radius);
  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const subtitle = `${formatMm(a)}mm x ${formatMm(b)}mm x ${formatMm(c)}mm / corner radius - ${formatMm(r)}mm`;
  drawTopPart(doc, a, b, c, r, subtitle, logoDataUrl);
  return doc;
}

export async function downloadTinBoxPdf(input: {
  a: number;
  b: number;
  c: number;
  radius: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateTinBoxPdf(input, logoDataUrl);
  doc.save(tinBoxPdfFileName(input.a, input.b, input.c, input.radius));
}
