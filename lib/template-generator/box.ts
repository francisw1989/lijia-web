import { jsPDF } from 'jspdf';
import { stampLogoOnPages } from './logo';

export const BOX_MATERIALS = [
  { mm: 1, label: '1mm high density mounted cardboard' },
  { mm: 1.5, label: '1.5mm high density mounted cardboard' },
  { mm: 2, label: '2mm high density mounted cardboard' },
  { mm: 2.5, label: '2.5mm high density mounted cardboard' },
] as const;

export type BoxMaterialMm = (typeof BOX_MATERIALS)[number]['mm'];

/** 与 Panda Template Generator 对齐的工艺常数 */
const BLEED = 3;
const WRAP = 15;
const SAFE = 3;
const TAB = 30; // 2 × wrap
const CHAMFER = 10;
const FIT = 3; // 盒底相对盒盖的配合间隙
const PAD = 30;

const C = {
  cut: [0, 1, 0, 0] as const,
  bleed: [1, 0, 0, 0] as const,
  fold: [0, 0, 1, 0] as const,
  margin: [1, 0, 0.65, 0] as const,
};

type Cmyk = readonly [number, number, number, number];
type Pt = [number, number];

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

function poly(doc: jsPDF, pts: Pt[], close = true) {
  const [first, ...rest] = pts;
  if (!first) return;
  doc.moveTo(first[0], first[1]);
  rest.forEach(([x, y]) => doc.lineTo(x, y));
  if (close) doc.close();
  doc.stroke();
}

function shoelace(pts: Pt[]) {
  let area = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  return area;
}

function lineIntersect(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt {
  const dax = a2[0] - a1[0];
  const day = a2[1] - a1[1];
  const dbx = b2[0] - b1[0];
  const dby = b2[1] - b1[1];
  const cross = dax * dby - day * dbx;
  if (Math.abs(cross) < 1e-9) {
    return [(a2[0] + b1[0]) / 2, (a2[1] + b1[1]) / 2];
  }
  const t = ((b1[0] - a1[0]) * dby - (b1[1] - a1[1]) * dbx) / cross;
  return [a1[0] + t * dax, a1[1] + t * day];
}

/**
 * 多边形外扩：每条边沿外法向平移 dist，再用邻边交点作为顶点。
 * 凹角处交点会自然“抄近路”，与 Panda Bleed 一致。
 */
function offsetPolygonOutward(pts: Pt[], dist: number): Pt[] {
  const n = pts.length;
  if (n < 3) return pts;
  // y 向下时，正面积≈屏幕顺时针；外侧取与常规 CCW 相反的法向
  const s = shoelace(pts) > 0 ? -1 : 1;

  const shifted: { a: Pt; b: Pt }[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = ((-dy) / len) * s;
    const ny = (dx / len) * s;
    shifted.push({
      a: [a[0] + nx * dist, a[1] + ny * dist],
      b: [b[0] + nx * dist, b[1] + ny * dist],
    });
  }

  const out: Pt[] = [];
  for (let i = 0; i < n; i += 1) {
    const prev = shifted[(i - 1 + n) % n];
    const cur = shifted[i];
    out.push(lineIntersect(prev.a, prev.b, cur.a, cur.b));
  }
  return out;
}

function materialToken(mm: number) {
  return Number.isInteger(mm) ? String(mm) : String(mm).replace('.', '');
}

export function boxPdfFileName(x: number, y: number, z: number, thickness: number) {
  return `Box-${materialToken(thickness)}_${x}x${y}x${z}mm.pdf`;
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

/**
 * 在 (x,y) 处居中绘制标签。
 * jsPDF 的 align:"center" 在旋转时按页坐标减半宽，90/180/270 会偏，故手动锚点。
 */
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

/** Y > X：粘合耳在左右壁；否则在上下壁（对齐 Panda） */
function tabsOnSideWalls(cw: number, ch: number) {
  return ch > cw;
}

/**
 * 十字刀模（y 向下，jsPDF）：
 * - 中心 cw×ch，四壁 wh（= Z），外端 wrap 15mm
 * - glue tab 宽 30、倒角 10；朝向随 cw/ch 切换
 */
function cutOutline(cx: number, cy: number, cw: number, ch: number, wh: number): Pt[] {
  const xL = cx - wh - WRAP;
  const xR = cx + cw + wh + WRAP;
  const yT = cy - wh - WRAP;
  const yB = cy + ch + wh + WRAP;

  if (tabsOnSideWalls(cw, ch)) {
    // 耳在左右壁的上下沿
    return [
      [xL, cy],
      [cx - wh, cy],
      [cx - wh + CHAMFER, cy - TAB],
      [cx - CHAMFER, cy - TAB],
      [cx, cy],
      [cx, yT],
      [cx + cw, yT],
      [cx + cw, cy],
      [cx + cw + CHAMFER, cy - TAB],
      [cx + cw + wh - CHAMFER, cy - TAB],
      [cx + cw + wh, cy],
      [xR, cy],
      [xR, cy + ch],
      [cx + cw + wh, cy + ch],
      [cx + cw + wh - CHAMFER, cy + ch + TAB],
      [cx + cw + CHAMFER, cy + ch + TAB],
      [cx + cw, cy + ch],
      [cx + cw, yB],
      [cx, yB],
      [cx, cy + ch],
      [cx - CHAMFER, cy + ch + TAB],
      [cx - wh + CHAMFER, cy + ch + TAB],
      [cx - wh, cy + ch],
      [xL, cy + ch],
    ];
  }

  // 耳在上下壁的左右沿
  return [
    [xL, cy],
    [cx, cy],
    [cx - TAB, cy - CHAMFER],
    [cx - TAB, cy - wh + CHAMFER],
    [cx, cy - wh],
    [cx, yT],
    [cx + cw, yT],
    [cx + cw, cy - wh],
    [cx + cw + TAB, cy - wh + CHAMFER],
    [cx + cw + TAB, cy - CHAMFER],
    [cx + cw, cy],
    [xR, cy],
    [xR, cy + ch],
    [cx + cw, cy + ch],
    [cx + cw + TAB, cy + ch + CHAMFER],
    [cx + cw + TAB, cy + ch + wh - CHAMFER],
    [cx + cw, cy + ch + wh],
    [cx + cw, yB],
    [cx, yB],
    [cx, cy + ch + wh],
    [cx - TAB, cy + ch + wh - CHAMFER],
    [cx - TAB, cy + ch + CHAMFER],
    [cx, cy + ch],
    [xL, cy + ch],
  ];
}

/**
 * Bleed 用简化外形：凹角处把粘合耳直角化，再整体外扩 3mm。
 */
function bleedSourceOutline(
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  wh: number,
): Pt[] {
  const xL = cx - wh - WRAP;
  const xR = cx + cw + wh + WRAP;
  const yT = cy - wh - WRAP;
  const yB = cy + ch + wh + WRAP;

  if (tabsOnSideWalls(cw, ch)) {
    return [
      [xL, cy],
      [cx - wh, cy],
      [cx - wh + CHAMFER, cy - TAB],
      [cx, cy - TAB],
      [cx, yT],
      [cx + cw, yT],
      [cx + cw, cy - TAB],
      [cx + cw + wh - CHAMFER, cy - TAB],
      [cx + cw + wh, cy],
      [xR, cy],
      [xR, cy + ch],
      [cx + cw + wh, cy + ch],
      [cx + cw + wh - CHAMFER, cy + ch + TAB],
      [cx + cw, cy + ch + TAB],
      [cx + cw, yB],
      [cx, yB],
      [cx, cy + ch + TAB],
      [cx - wh + CHAMFER, cy + ch + TAB],
      [cx - wh, cy + ch],
      [xL, cy + ch],
    ];
  }

  return [
    [xL, cy],
    [cx - TAB, cy],
    [cx - TAB, cy - wh + CHAMFER],
    [cx, cy - wh],
    [cx, yT],
    [cx + cw, yT],
    [cx + cw, cy - wh],
    [cx + cw + TAB, cy - wh + CHAMFER],
    [cx + cw + TAB, cy],
    [xR, cy],
    [xR, cy + ch],
    [cx + cw + TAB, cy + ch],
    [cx + cw + TAB, cy + ch + wh - CHAMFER],
    [cx + cw, cy + ch + wh],
    [cx + cw, yB],
    [cx, yB],
    [cx, cy + ch + wh],
    [cx - TAB, cy + ch + wh - CHAMFER],
    [cx - TAB, cy + ch],
    [xL, cy + ch],
  ];
}

/** Bleed = 简化 Cut 外形的 3mm 等距外扩 */
function bleedOutline(cx: number, cy: number, cw: number, ch: number, wh: number): Pt[] {
  return offsetPolygonOutward(bleedSourceOutline(cx, cy, cw, ch, wh), BLEED);
}

function pageSizeFor(cw: number, ch: number, wh: number) {
  const netW = cw + 2 * wh + 2 * WRAP;
  const netH = ch + 2 * wh + 2 * WRAP;
  return {
    pageW: netW + 2 * BLEED + 2 * PAD,
    pageH: netH + 2 * BLEED + 2 * PAD,
  };
}

function drawPart(
  doc: jsPDF,
  opts: {
    cw: number;
    ch: number;
    wall: number;
    title: string;
    subtitle: string;
    actualSize?: string;
    /** 盒底与盒盖共用盖的页尺寸（对齐 Panda） */
    pageW: number;
    pageH: number;
  },
) {
  const { cw, ch, wall: wh, pageW, pageH } = opts;
  const netW = cw + 2 * wh + 2 * WRAP;
  const netH = ch + 2 * wh + 2 * WRAP;

  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  // 在页内居中刀模（盒底略小，边距自动加大）
  const cx = (pageW - netW) / 2 + WRAP + wh;
  const cy = (pageH - netH) / 2 + WRAP + wh;

  ink(doc);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, pageW / 2, 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(opts.subtitle, pageW / 2, 14.5, { align: 'center' });
  if (opts.actualSize) {
    doc.setFontSize(8);
    doc.text(opts.actualSize, pageW / 2, 19.5, { align: 'center' });
  }
  legend(doc, pageW - 28, 7);

  
  // Cut → Fold → Margin → Bleed（Bleed 最后，盖住黄线）
  stroke(doc, C.cut, false, 0.3);
  poly(doc, cutOutline(cx, cy, cw, ch, wh));

  stroke(doc, C.fold, false, 0.28);
  doc.rect(cx - wh, cy, cw + 2 * wh, ch);
  doc.rect(cx, cy - wh, cw, ch + 2 * wh);

  stroke(doc, C.margin, true, 0.28);
  if (cw > SAFE * 2 && ch > SAFE * 2) {
    doc.rect(cx + SAFE, cy + SAFE, cw - SAFE * 2, ch - SAFE * 2);
  }
  if (cw > SAFE * 2 && wh > SAFE * 2) {
    doc.rect(cx + SAFE, cy - wh + SAFE, cw - SAFE * 2, wh - SAFE * 2);
    doc.rect(cx + SAFE, cy + ch + SAFE, cw - SAFE * 2, wh - SAFE * 2);
  }
  if (ch > SAFE * 2 && wh > SAFE * 2) {
    doc.rect(cx - wh + SAFE, cy + SAFE, wh - SAFE * 2, ch - SAFE * 2);
    doc.rect(cx + cw + SAFE, cy + SAFE, wh - SAFE * 2, ch - SAFE * 2);
  }

  stroke(doc, C.bleed, false, 0.3);
  poly(doc, bleedOutline(cx, cy, cw, ch, wh));

  // Labels — 色带几何中心；旋转时手动锚点（jsPDF align+angle 会偏）
  ink(doc);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const wrapText = `Wrap Around ${WRAP}mm`;
  const bleedText = `Bleed ${BLEED}mm`;
  const mx = cx + cw / 2;
  const my = cy + ch / 2;

  centeredLabel(doc, wrapText, mx, cy - wh - WRAP / 2, 0);
  centeredLabel(doc, bleedText, mx, cy - wh - WRAP - BLEED / 2, 0);
  centeredLabel(doc, wrapText, mx, cy + ch + wh + WRAP / 2, 180);
  centeredLabel(doc, bleedText, mx, cy + ch + wh + WRAP + BLEED / 2, 180);
  centeredLabel(doc, wrapText, cx + cw + wh + WRAP / 2, my, 90);
  centeredLabel(doc, bleedText, cx + cw + wh + WRAP + BLEED / 2, my, 90);
  centeredLabel(doc, wrapText, cx - wh - WRAP / 2, my, 270);
  centeredLabel(doc, bleedText, cx - wh - WRAP - BLEED / 2, my, 270);
}

export function generateTwoPieceBoxPdf(input: {
  x: number;
  y: number;
  z: number;
  thickness: number;
}) {
  const { x, y, z, thickness: t } = input;
  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const size = `${x}mm x ${y}mm x ${z}mm - ${t}mm material`;
  const { pageW, pageH } = pageSizeFor(x, y, z);

  // 盒盖：用户尺寸为中心，壁高 = Z
  drawPart(doc, {
    cw: x,
    ch: y,
    wall: z,
    title: 'Two Piece Box template - box top for',
    subtitle: size,
    pageW,
    pageH,
  });

  // 盒底：中心按材料厚 + 配合间隙缩小（对齐 Panda：100/1mm → 95）
  const bottomX = Math.max(10, x - 2 * t - FIT);
  const bottomY = Math.max(10, y - 2 * t - FIT);
  drawPart(doc, {
    cw: bottomX,
    ch: bottomY,
    wall: z,
    title: 'Two Piece Box template - box bottom for',
    subtitle: size,
    actualSize: `(${bottomX}mm x ${bottomY}mm x ${z}mm actual size)`,
    pageW,
    pageH,
  });

  return doc;
}

export async function downloadTwoPieceBoxPdf(input: {
  x: number;
  y: number;
  z: number;
  thickness: number;
}) {
  const doc = generateTwoPieceBoxPdf(input);
  await stampLogoOnPages(doc);
  doc.save(boxPdfFileName(input.x, input.y, input.z, input.thickness));
}
