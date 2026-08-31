import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import {
  BLEED,
  drawFoldGuides,
  drawRectGuides,
  HEADER,
  LEGEND_W,
  PAD,
} from './style';
import type { SheetFoldId } from './folds';

export { SHEET_FOLDS, type SheetFoldId } from './folds';

export function paperSheetPdfFileName(x: number, y: number) {
  return `PaperSheet${x}x${y}mm.pdf`;
}

export function generatePaperSheetPdf(
  input: { x: number; y: number; fold: SheetFoldId },
  logoDataUrl: string,
) {
  const { x: bw, y: bh, fold } = input;
  const title = 'Paper Sheet Template';
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
  drawFoldGuides(doc, bx, by, bw, bh, fold);

  return doc;
}

export async function downloadPaperSheetPdf(input: {
  x: number;
  y: number;
  fold: SheetFoldId;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generatePaperSheetPdf(input, logoDataUrl);
  doc.save(paperSheetPdfFileName(input.x, input.y));
}
