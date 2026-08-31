import { jsPDF } from 'jspdf';
import {
  LINE,
  drawHeader,
  drawLegend,
  ink,
  loadLogoDataUrl,
  stroke,
} from './logo';

/** 与 Panda Game Board 对齐 */
const BLEED = 3;
const WRAP = 15;
const SAFE = 3;
const PAD = 40;

const C = {
  dieline: LINE.dieline,
  bleed: LINE.bleed,
  margin: LINE.margin,
};

export const BOARD_FOLDS = [
  { id: 'none', label: 'No Fold' },
  { id: 'half-h', label: '1/2 Fold (horizontal)' },
  { id: 'half-v', label: '1/2 Fold (vertical)' },
  { id: 'third-h', label: '1/3 Fold (horizontal)' },
  { id: 'third-v', label: '1/3 Fold (vertical)' },
  { id: 'quarter', label: '1/4 Fold' },
  { id: 'sixth', label: '1/6 Fold' },
] as const;

export type BoardFoldId = (typeof BOARD_FOLDS)[number]['id'];

export function foldedBoardSize(x: number, y: number, fold: BoardFoldId) {
  switch (fold) {
    case 'none':
      return { w: x, h: y };
    case 'half-h':
      return { w: x, h: y / 2 };
    case 'half-v':
      return { w: x / 2, h: y };
    case 'third-h':
      return { w: x, h: y / 3 };
    case 'third-v':
      return { w: x / 3, h: y };
    case 'quarter':
      return { w: x / 2, h: y / 2 };
    case 'sixth':
      // 6 格：长边三等分、短边对折
      return x >= y ? { w: x / 3, h: y / 2 } : { w: x / 2, h: y / 3 };
    default:
      return { w: x, h: y };
  }
}

/** 折线：在板面矩形内按模式均分 */
function foldLines(
  x0: number,
  y0: number,
  bw: number,
  bh: number,
  fold: BoardFoldId,
): { x1: number; y1: number; x2: number; y2: number }[] {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const addH = (parts: number) => {
    for (let i = 1; i < parts; i += 1) {
      const y = y0 + (bh * i) / parts;
      lines.push({ x1: x0, y1: y, x2: x0 + bw, y2: y });
    }
  };
  const addV = (parts: number) => {
    for (let i = 1; i < parts; i += 1) {
      const x = x0 + (bw * i) / parts;
      lines.push({ x1: x, y1: y0, x2: x, y2: y0 + bh });
    }
  };

  switch (fold) {
    case 'none':
      break;
    case 'half-h':
      addH(2);
      break;
    case 'half-v':
      addV(2);
      break;
    case 'third-h':
      addH(3);
      break;
    case 'third-v':
      addV(3);
      break;
    case 'quarter':
      addH(2);
      addV(2);
      break;
    case 'sixth':
      // 2×3 格：长边三等分、短边对折（竖板 2 列×3 行，横板 3 列×2 行）
      if (bw >= bh) {
        addV(3);
        addH(2);
      } else {
        addV(2);
        addH(3);
      }
      break;
    default:
      break;
  }
  return lines;
}

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
  const by = 32 + BLEED + WRAP;

  drawHeader(doc, {
    pageW,
    logoDataUrl: opts.logoDataUrl,
    title: doubleSided ? 'Game Board Template - Front' : 'Game Board Template',
    subtitle: `${bw}mm x ${bh}mm`,
  });
  drawLegend(doc, pageW - 52, 9);

  stroke(doc, C.dieline, false, 0.3);
  doc.rect(bx, by, bw, bh);
  doc.rect(bx - WRAP, by - WRAP, bw + 2 * WRAP, bh + 2 * WRAP);

  stroke(doc, C.dieline, false, 0.28);
  foldLines(bx, by, bw, bh, fold).forEach((ln) => {
    doc.line(ln.x1, ln.y1, ln.x2, ln.y2);
  });

  stroke(doc, C.margin, true, 0.28);
  if (bw > SAFE * 2 && bh > SAFE * 2) {
    doc.rect(bx + SAFE, by + SAFE, bw - SAFE * 2, bh - SAFE * 2);
  }

  stroke(doc, C.bleed, true, 0.3);
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
  const by = 32 + BLEED + WRAP;
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
  drawLegend(doc, pageW - 52, 9);

  stroke(doc, C.dieline, false, 0.3);
  if (cw > 0 && ch > 0) doc.rect(cx, cy, cw, ch);

  stroke(doc, C.dieline, false, 0.28);
  if (cw > 0 && ch > 0) {
    foldLines(cx, cy, cw, ch, fold).forEach((ln) => {
      doc.line(ln.x1, ln.y1, ln.x2, ln.y2);
    });
  }

  stroke(doc, C.margin, true, 0.28);
  if (cw > SAFE * 2 && ch > SAFE * 2) {
    doc.rect(cx + SAFE, cy + SAFE, cw - SAFE * 2, ch - SAFE * 2);
  }

  stroke(doc, C.bleed, true, 0.3);
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
  const pageH = 32 + y + 2 * WRAP + 2 * BLEED + PAD;

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
  doc.save(boardPdfFileName(input.x, input.y));
}
