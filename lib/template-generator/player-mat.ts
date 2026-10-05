import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import {
  drawRoundedGuides,
  HEADER,
  LEGEND_W,
  PAD,
  openPdfDoc,
} from './style';

/** Paper Player Mats：内安全边 10mm，外出血 5mm */
export const PLAYER_MAT_SAFE = 10;
export const PLAYER_MAT_BLEED = 5;

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
    bw + 2 * PLAYER_MAT_BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle),
  );
  const pageH = HEADER + bh + 2 * PLAYER_MAT_BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const bx = (pageW - bw) / 2;
  const by = HEADER + PLAYER_MAT_BLEED;

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
    PLAYER_MAT_SAFE,
    PLAYER_MAT_BLEED,
  );

  return doc;
}

export async function downloadPlayerMatPdf(input: {
  x: number;
  y: number;
  radius: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generatePlayerMatPdf(input, logoDataUrl);
  await openPdfDoc(doc, playerMatPdfFileName(input.x, input.y, input.radius));
}
