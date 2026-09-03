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

export function playerMatPdfFileName(x: number, y: number, r: number) {
  return `PlayerMat${x}x${y}r${r}mm.pdf`;
}

export function generatePlayerMatPdf(
  input: { x: number; y: number; radius: number },
  logoDataUrl: string,
) {
  const { x: bw, y: bh, radius } = input;
  const title = 'Player Mat Template';
  const subtitle = `${bw}mm x ${bh}mm / border radius: ${radius}mm`;

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
  drawRoundedGuides(doc, bx, by, bw, bh, radius);

  return doc;
}

export async function downloadPlayerMatPdf(input: {
  x: number;
  y: number;
  radius: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generatePlayerMatPdf(input, logoDataUrl);
  openPdfDoc(doc);
}
