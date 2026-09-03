import { jsPDF } from 'jspdf';
import {
  drawHeader,
  drawLegend,
  headerMinPageWidth,
  loadLogoDataUrl,
} from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, strokeGuide, openPdfDoc } from './style';

/**
 * Foil Pack 展开刀线（对齐 BODA 规律）：
 * 横向：[封边 FLAP][背半 W/2][正面 W][背半 W/2][封边 FLAP]
 * 纵向：[热封 SEAL][高度 H][热封 SEAL]
 * 深度 C 只写入标题/文件名（成品厚度），不参与展开面宽。
 */
/** 上下热封边 */
const SEAL = 12;
/** 左右纵向封口粘边 */
const FLAP = 9;

function formatMm(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function foilPackPdfFileName(input: {
  x: number;
  y: number;
  z: number;
  cards?: number;
}) {
  if (input.cards && input.cards > 0) {
    return `FoilPack${input.x}x${input.y}-${input.cards}cards.pdf`;
  }
  return `FoilPack${input.x}x${input.y}x${formatMm(input.z)}mm.pdf`;
}

function marginRect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  if (w <= SAFE * 2 || h <= SAFE * 2) return;
  strokeGuide(doc, 'margin');
  doc.rect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE);
}

export function generateFoilPackPdf(
  input: { x: number; y: number; z: number; cards?: number },
  logoDataUrl: string,
) {
  const w = input.x;
  const h = input.y;
  const d = input.z;
  const halfBack = w / 2;
  const title = 'Foil Pack Template';
  const subtitle = input.cards
    ? `${w}mm x ${h}mm - ${input.cards} cards`
    : `${w}mm x ${h}mm x ${formatMm(d)}mm`;

  // 展开宽 = 2×封边 + 2×宽（背被对半拆到正面两侧）；高 = 2×热封 + 高
  const netW = FLAP + halfBack + w + halfBack + FLAP;
  const netH = SEAL + h + SEAL;

  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = Math.max(
    netW + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle),
  );
  const pageH = HEADER + netH + 2 * BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const ox = (pageW - netW) / 2;
  const oy = HEADER + BLEED;

  drawHeader(doc, { pageW, logoDataUrl, title, subtitle });
  drawLegend(doc, pageW - LEGEND_W, 9);

  strokeGuide(doc, 'bleed');
  doc.rect(ox - BLEED, oy - BLEED, netW + 2 * BLEED, netH + 2 * BLEED);

  strokeGuide(doc, 'dieline');
  doc.rect(ox, oy, netW, netH);

  const x1 = ox + FLAP;
  const x2 = x1 + halfBack;
  const x3 = x2 + w;
  const x4 = x3 + halfBack;
  const y1 = oy + SEAL;
  const y2 = y1 + h;

  strokeGuide(doc, 'dieline');
  doc.line(x1, oy, x1, oy + netH);
  doc.line(x2, oy, x2, oy + netH);
  doc.line(x3, oy, x3, oy + netH);
  doc.line(x4, oy, x4, oy + netH);
  doc.line(ox, y1, ox + netW, y1);
  doc.line(ox, y2, ox + netW, y2);

  // 安全边只画在三个主可视面（左背半 / 正面 / 右背半），不进封边与热封带
  marginRect(doc, x1, y1, halfBack, h);
  marginRect(doc, x2, y1, w, h);
  marginRect(doc, x3, y1, halfBack, h);

  return doc;
}

export async function downloadFoilPackPdf(input: {
  x: number;
  y: number;
  z: number;
  cards?: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateFoilPackPdf(input, logoDataUrl);
  openPdfDoc(doc);
}
