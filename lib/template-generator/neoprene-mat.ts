import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import {
  BLEED,
  drawRoundedGuides,
  HEADER,
  LEGEND_W,
  PAD,
  openPdfDoc,
} from './style';

/** 缝边会吃进成品边，安全区比普通 3mm 更大 */
export const NEOPRENE_STITCH_SAFE = 6;

export const NEOPRENE_RADII = [
  { mm: 0, label: 'no round corners' },
  { mm: 15, label: '15mm' },
  { mm: 20, label: '20mm' },
  { mm: 25, label: '25mm' },
] as const;

export const DEFAULT_NEOPRENE_RADIUS = 20;

export function neopreneMatPdfFileName(
  x: number,
  y: number,
  r: number,
  stitched: boolean,
) {
  return `NeopreneMat${x}x${y}r${r}mm${stitched ? '-stitched' : ''}.pdf`;
}

export function generateNeopreneMatPdf(
  input: { x: number; y: number; radius: number; stitched: boolean },
  logoDataUrl: string,
) {
  const { x: bw, y: bh, radius, stitched } = input;
  const title = stitched
    ? 'Neoprene Mat Template - Stitched edge'
    : 'Neoprene Mat Template';
  const subtitle = `${bw}mm x ${bh}mm / corner radius: ${radius}mm`;

  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = Math.max(
    bw + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle),
  );
  const pageH = HEADER + bh + 2 * BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const bx = (pageW - bw) / 2;
  const by = HEADER + BLEED;

  drawHeader(doc, {
    pageW,
    logoDataUrl,
    title,
    subtitle,
  });
  drawLegend(doc, pageW - LEGEND_W, 9);
  drawRoundedGuides(
    doc,
    bx,
    by,
    bw,
    bh,
    radius,
    stitched ? NEOPRENE_STITCH_SAFE : undefined,
  );

  return doc;
}

export async function downloadNeopreneMatPdf(input: {
  x: number;
  y: number;
  radius: number;
  stitched: boolean;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateNeopreneMatPdf(input, logoDataUrl);
  openPdfDoc(doc);
}
