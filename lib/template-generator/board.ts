import { jsPDF } from 'jspdf';
import {
  drawHeader,
  drawLegend,
  ink,
  loadLogoDataUrl,
} from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, WRAP, strokeGuide, openPdfDoc } from './style';
import {
  FOLD_PRESETS,
  foldLines,
  foldedSize,
  type FoldId,
} from './folds';

export const BOARD_FOLDS = FOLD_PRESETS;
export type BoardFoldId = FoldId;
export const foldedBoardSize = foldedSize;

function drawFront(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    fold: BoardFoldId;
    doubleSided: boolean;
    pageW: number;
    pageH: number;
    logoDataUrl: string;
  },
) {
  const { x: bw, y: bh, fold, doubleSided, pageW, pageH } = opts;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const netW = bw + 2 * WRAP;
  const bx = (pageW - netW) / 2 + WRAP;
  const by = HEADER + BLEED + WRAP;

  drawHeader(doc, {
    pageW,
    logoDataUrl: opts.logoDataUrl,
    title: doubleSided ? 'Game Board Template - Front' : 'Game Board Template',
    subtitle: `${bw}mm x ${bh}mm`,
  });
  drawLegend(doc, pageW - LEGEND_W, 9);

  strokeGuide(doc, 'dieline');
  doc.rect(bx, by, bw, bh);
  doc.rect(bx - WRAP, by - WRAP, bw + 2 * WRAP, bh + 2 * WRAP);

  strokeGuide(doc, 'dieline');
  foldLines(bx, by, bw, bh, fold).forEach((ln) => {
    doc.line(ln.x1, ln.y1, ln.x2, ln.y2);
  });

  strokeGuide(doc, 'margin');
  if (bw > SAFE * 2 && bh > SAFE * 2) {
    doc.rect(bx + SAFE, by + SAFE, bw - SAFE * 2, bh - SAFE * 2);
  }

  strokeGuide(doc, 'bleed');
  doc.rect(
    bx - WRAP - BLEED,
    by - WRAP - BLEED,
    bw + 2 * WRAP + 2 * BLEED,
    bh + 2 * WRAP + 2 * BLEED,
  );

  if (doubleSided) {
    ink(doc);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GAME BOARD FRONT', bx + bw / 2, by + bh / 2, {
      align: 'center',
      baseline: 'middle',
    });
  }
}

function drawBack(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    fold: BoardFoldId;
    pageW: number;
    pageH: number;
    logoDataUrl: string;
  },
) {
  const { x: bw, y: bh, fold, pageW, pageH } = opts;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const netW = bw + 2 * WRAP;
  const bx = (pageW - netW) / 2 + WRAP;
  const by = HEADER + BLEED + WRAP;
  const cx = bx + SAFE;
  const cy = by + SAFE;
  const cw = bw - SAFE * 2;
  const ch = bh - SAFE * 2;

  drawHeader(doc, {
    pageW,
    logoDataUrl: opts.logoDataUrl,
    title: 'Game Board Template - Back',
    subtitle: `${bw}mm x ${bh}mm`,
  });
  drawLegend(doc, pageW - LEGEND_W, 9);

  strokeGuide(doc, 'dieline');
  if (cw > 0 && ch > 0) doc.rect(cx, cy, cw, ch);

  strokeGuide(doc, 'dieline');
  if (cw > 0 && ch > 0) {
    foldLines(cx, cy, cw, ch, fold).forEach((ln) => {
      doc.line(ln.x1, ln.y1, ln.x2, ln.y2);
    });
  }

  strokeGuide(doc, 'margin');
  if (cw > SAFE * 2 && ch > SAFE * 2) {
    doc.rect(cx + SAFE, cy + SAFE, cw - SAFE * 2, ch - SAFE * 2);
  }

  strokeGuide(doc, 'bleed');
  doc.rect(bx, by, bw, bh);

  ink(doc);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GAME BOARD BACK', bx + bw / 2, by + bh / 2, {
    align: 'center',
    baseline: 'middle',
  });
}

export function boardPdfFileName(x: number, y: number) {
  return `GameBoard${x}x${y}mm.pdf`;
}

export function generateGameBoardPdf(
  input: {
    x: number;
    y: number;
    fold: BoardFoldId;
    doubleSided: boolean;
  },
  logoDataUrl: string,
) {
  const { x, y, fold, doubleSided } = input;
  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = x + 2 * WRAP + 2 * BLEED + 2 * PAD;
  const pageH = HEADER + y + 2 * WRAP + 2 * BLEED + PAD;

  drawFront(doc, { x, y, fold, doubleSided, pageW, pageH, logoDataUrl });
  if (doubleSided) {
    drawBack(doc, { x, y, fold, pageW, pageH, logoDataUrl });
  }

  return doc;
}

export async function downloadGameBoardPdf(input: {
  x: number;
  y: number;
  fold: BoardFoldId;
  doubleSided: boolean;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateGameBoardPdf(input, logoDataUrl);
  openPdfDoc(doc);
}
