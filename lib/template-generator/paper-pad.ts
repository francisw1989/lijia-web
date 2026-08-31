import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import {
  BLEED,
  drawRectGuides,
  HEADER,
  LEGEND_W,
  PAD,
} from './style';

export function paperPadPdfFileName(x: number, y: number) {
  return `PaperPad${x}x${y}mm.pdf`;
}

export function generatePaperPadPdf(
  input: { x: number; y: number },
  logoDataUrl: string,
) {
  const { x: bw, y: bh } = input;
  const title = 'Paper Pad Template';
  const subtitle = `${bw}mm x ${bh}mm`;

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
  drawRectGuides(doc, bx, by, bw, bh);

  return doc;
}

export async function downloadPaperPadPdf(input: { x: number; y: number }) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generatePaperPadPdf(input, logoDataUrl);
  doc.save(paperPadPdfFileName(input.x, input.y));
}
