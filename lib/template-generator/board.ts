import { jsPDF } from 'jspdf';
import { stampLogoOnPages } from './logo';

/** 与 Panda Game Board 对齐 */
const BLEED = 3;
const WRAP = 15;
const SAFE = 3;
const PAD = 30;

const C = {
  cut: [0, 1, 0, 0] as const,
  bleed: [1, 0, 0, 0] as const,
  fold: [0, 0, 1, 0] as const,
  margin: [1, 0, 0.65, 0] as const,
};

type Cmyk = readonly [number, number, number, number];

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

function stroke(doc: jsPDF, color: Cmyk, dashed = false, width = 0.25) {
  doc.setDrawColor(color[0], color[1], color[2], color[3]);
  doc.setLineWidth(width);
  doc.setLineDashPattern(dashed ? [5, 5] : [], 0);
}

function ink(doc: jsPDF) {
  doc.setTextColor(0, 0, 0, 1);
  doc.setDrawColor(0, 0, 0, 1);
  doc.setLineDashPattern([], 0);
}

function legend(doc: jsPDF, x: number, y: number) {
  ink(doc);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Legend', x, y);
  const rows: { label: string; color: Cmyk; dashed?: boolean }[] = [
    { label: 'Cut', color: C.cut },
    { label: 'Bleed', color: C.bleed },
    { label: 'Margin', color: C.margin, dashed: true },
    { label: 'Fold', color: C.fold },
  ];
  rows.forEach((row, i) => {
    const yy = y + 5.5 + i * 5.5;
    stroke(doc, row.color, !!row.dashed, 0.55);
    doc.line(x, yy, x + 9, yy);
    ink(doc);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(row.label, x + 12, yy + 1);
  });
}

function centeredLabel(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  angle: 0 | 90 | 180 | 270,
) {
  const w = doc.getTextWidth(text);
  let ax = x;
  let ay = y;
  if (angle === 0) ax = x - w / 2;
  else if (angle === 180) ax = x + w / 2;
  else if (angle === 90) ay = y + w / 2;
  else ay = y - w / 2;

  doc.text(text, ax, ay, {
    baseline: 'middle',
    ...(angle === 0 ? {} : { angle }),
  });
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

function drawEdgeLabels(
  doc: jsPDF,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  withWrap: boolean,
) {
  ink(doc);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const mx = bx + bw / 2;
  const my = by + bh / 2;
  const wrapText = `Wrap Around ${WRAP} mm`;
  const bleedText = `Bleed ${BLEED}mm`;

  if (withWrap) {
    // Wrap 在板边与 wrap 外沿之间；Bleed 在 wrap 与 bleed 外沿之间
    centeredLabel(doc, wrapText, mx, by - WRAP / 2, 0);
    centeredLabel(doc, bleedText, mx, by - WRAP - BLEED / 2, 0);
    centeredLabel(doc, wrapText, mx, by + bh + WRAP / 2, 180);
    centeredLabel(doc, bleedText, mx, by + bh + WRAP + BLEED / 2, 180);
    centeredLabel(doc, wrapText, bx + bw + WRAP / 2, my, 90);
    centeredLabel(doc, bleedText, bx + bw + WRAP + BLEED / 2, my, 90);
    centeredLabel(doc, wrapText, bx - WRAP / 2, my, 270);
    centeredLabel(doc, bleedText, bx - WRAP - BLEED / 2, my, 270);
  } else {
    // 背面无 wrap：Bleed 紧贴板外沿外侧 3mm 带
    centeredLabel(doc, bleedText, mx, by - BLEED / 2, 0);
    centeredLabel(doc, bleedText, mx, by + bh + BLEED / 2, 180);
    centeredLabel(doc, bleedText, bx + bw + BLEED / 2, my, 90);
    centeredLabel(doc, bleedText, bx - BLEED / 2, my, 270);
  }
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
  },
) {
  const { x: bw, y: bh, fold, doubleSided, pageW, pageH } = opts;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const netW = bw + 2 * WRAP;
  const bx = (pageW - netW) / 2 + WRAP;
  const by = 20 + BLEED + WRAP;

  ink(doc);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    doubleSided ? 'Game Board template - front' : 'Game Board template',
    pageW / 2,
    9,
    { align: 'center' },
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${bw}mm x ${bh}mm`, pageW / 2, 14.5, { align: 'center' });
  legend(doc, pageW - 28, 7);

  // Cut：板面 + wrap 外沿
  stroke(doc, C.cut, false, 0.3);
  doc.rect(bx, by, bw, bh);
  doc.rect(bx - WRAP, by - WRAP, bw + 2 * WRAP, bh + 2 * WRAP);

  // Fold
  stroke(doc, C.fold, false, 0.28);
  foldLines(bx, by, bw, bh, fold).forEach((ln) => {
    doc.line(ln.x1, ln.y1, ln.x2, ln.y2);
  });

  // Margin
  stroke(doc, C.margin, true, 0.28);
  if (bw > SAFE * 2 && bh > SAFE * 2) {
    doc.rect(bx + SAFE, by + SAFE, bw - SAFE * 2, bh - SAFE * 2);
  }

  // Bleed
  stroke(doc, C.bleed, false, 0.3);
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

  drawEdgeLabels(doc, bx, by, bw, bh, true);
}

function drawBack(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    fold: BoardFoldId;
    pageW: number;
    pageH: number;
  },
) {
  const { x: bw, y: bh, fold, pageW, pageH } = opts;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  // 与正面板面对齐
  const netW = bw + 2 * WRAP;
  const bx = (pageW - netW) / 2 + WRAP;
  const by = 20 + BLEED + WRAP;
  // 背面 Cut = 板面内缩 3mm；Bleed = 板面外沿
  const cx = bx + SAFE;
  const cy = by + SAFE;
  const cw = bw - SAFE * 2;
  const ch = bh - SAFE * 2;

  ink(doc);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Game Board template - back', pageW / 2, 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${bw}mm x ${bh}mm`, pageW / 2, 14.5, { align: 'center' });
  legend(doc, pageW - 28, 7);

  stroke(doc, C.cut, false, 0.3);
  if (cw > 0 && ch > 0) doc.rect(cx, cy, cw, ch);

  stroke(doc, C.fold, false, 0.28);
  if (cw > 0 && ch > 0) {
    foldLines(cx, cy, cw, ch, fold).forEach((ln) => {
      doc.line(ln.x1, ln.y1, ln.x2, ln.y2);
    });
  }

  stroke(doc, C.margin, true, 0.28);
  if (cw > SAFE * 2 && ch > SAFE * 2) {
    doc.rect(cx + SAFE, cy + SAFE, cw - SAFE * 2, ch - SAFE * 2);
  }

  stroke(doc, C.bleed, false, 0.3);
  doc.rect(bx, by, bw, bh);

  ink(doc);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GAME BOARD BACK', bx + bw / 2, by + bh / 2, {
    align: 'center',
    baseline: 'middle',
  });

  // Bleed 标注落在板外沿与内缩 Cut 之间的 3mm 带
  ink(doc);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const bleedText = `Bleed ${BLEED}mm`;
  const mx = bx + bw / 2;
  const my = by + bh / 2;
  centeredLabel(doc, bleedText, mx, by + SAFE / 2, 0);
  centeredLabel(doc, bleedText, mx, by + bh - SAFE / 2, 180);
  centeredLabel(doc, bleedText, bx + bw - SAFE / 2, my, 90);
  centeredLabel(doc, bleedText, bx + SAFE / 2, my, 270);
}

export function boardPdfFileName(x: number, y: number) {
  return `GameBoard${x}x${y}mm.pdf`;
}

export function generateGameBoardPdf(input: {
  x: number;
  y: number;
  fold: BoardFoldId;
  doubleSided: boolean;
}) {
  const { x, y, fold, doubleSided } = input;
  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = x + 2 * WRAP + 2 * BLEED + 2 * PAD;
  const pageH = 20 + y + 2 * WRAP + 2 * BLEED + PAD;

  drawFront(doc, { x, y, fold, doubleSided, pageW, pageH });
  if (doubleSided) {
    drawBack(doc, { x, y, fold, pageW, pageH });
  }

  return doc;
}

export async function downloadGameBoardPdf(input: {
  x: number;
  y: number;
  fold: BoardFoldId;
  doubleSided: boolean;
}) {
  const doc = generateGameBoardPdf(input);
  await stampLogoOnPages(doc);
  doc.save(boardPdfFileName(input.x, input.y));
}
