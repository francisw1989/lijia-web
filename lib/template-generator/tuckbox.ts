/**
 * Tuckbox（插口盒）刀模 PDF
 *
 * 展开顺序（左→右，对照 BODA 截图）：
 *   [侧 D] [背面 W + 上下盖/插舌] [侧 D] [正面 W + 拇指口] [粘边]
 *
 * 坐标系：jsPDF，单位 mm，y 向下增大。
 * 工艺线：Margin（绿虚）+ Fold/Dieline（品红）+ Outer Bleed（青虚；凹角桥接后外扩）。
 *
 * 尺寸输入：x=宽 W，y=高 H，z=深 D（或由张数×纸厚换算）
 */
import { jsPDF } from 'jspdf';
import {
  drawHeader,
  drawLegend,
  headerMinPageWidth,
  loadLogoDataUrl,
} from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, strokeGuide } from './style';

/** 卡牌纸张选项：用张数推算盒深时使用 */
export const CARD_STOCKS = [
  {
    id: '300-black',
    mm: 0.3,
    label: '300gsm black core paper (0.30mm thickness)',
  },
  {
    id: '300-ivory',
    mm: 0.31,
    label: '300gsm ivory core paper (0.31mm thickness)',
  },
  {
    id: '350-ivory',
    mm: 0.36,
    label: '350gsm ivory core paper (0.36mm thickness)',
  },
] as const;

export type CardStockId = (typeof CARD_STOCKS)[number]['id'];

type Pt = [number, number];

export function cardStockMm(id: string) {
  return CARD_STOCKS.find((item) => item.id === id)?.mm ?? NaN;
}

/** 张数 × 单张厚度 → 盒深（mm，一位小数） */
export function tuckboxDepthFromCards(qty: number, thicknessMm: number) {
  if (!(qty > 0) || !(thicknessMm > 0)) return NaN;
  return Math.round(qty * thicknessMm * 10) / 10;
}

function formatMm(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function tuckboxPdfFileName(input: {
  x: number;
  y: number;
  z: number;
  cards?: number;
}) {
  if (input.cards && input.cards > 0) {
    return `Tuckbox${input.x}x${input.y}-${input.cards}cards.pdf`;
  }
  return `Tuckbox${input.x}x${input.y}x${formatMm(input.z)}mm.pdf`;
}

function poly(doc: jsPDF, pts: Pt[], close = true) {
  const [first, ...rest] = pts;
  if (!first) return;
  doc.moveTo(first[0], first[1]);
  rest.forEach(([x, y]) => doc.lineTo(x, y));
  if (close) doc.close();
  doc.stroke();
}

/** 多边形有向面积：>0 表示顶点顺序在屏幕上为顺时针（y 向下时） */
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

/** 去掉过近的重复点，避免退化边把外扩撑出尖刺 */
function dedupePts(pts: Pt[], eps = 0.05): Pt[] {
  const out: Pt[] = [];
  for (const p of pts) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(p[0] - prev[0], p[1] - prev[1]) > eps) out.push(p);
  }
  if (out.length > 2) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= eps) out.pop();
  }
  return out;
}

/**
 * 多边形法向外扩（dist>0）或内收（dist<0）。
 * 斜接过长时改为单点斜切，避免凹角尖刺。
 */
function offsetPolygon(pts: Pt[], dist: number, miterLimit = 2.5): Pt[] {
  const cleaned = dedupePts(pts);
  const n = cleaned.length;
  if (n < 3) return cleaned;
  const s = shoelace(cleaned) > 0 ? -1 : 1;

  const shifted: { a: Pt; b: Pt }[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = cleaned[i];
    const b = cleaned[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * s;
    const ny = (dx / len) * s;
    shifted.push({
      a: [a[0] + nx * dist, a[1] + ny * dist],
      b: [b[0] + nx * dist, b[1] + ny * dist],
    });
  }

  const out: Pt[] = [];
  const maxMiter = Math.abs(dist) * miterLimit;
  for (let i = 0; i < n; i += 1) {
    const prev = shifted[(i - 1 + n) % n];
    const cur = shifted[i];
    const vertex = cleaned[i];
    const hit = lineIntersect(prev.a, prev.b, cur.a, cur.b);
    const miterLen = Math.hypot(hit[0] - vertex[0], hit[1] - vertex[1]);
    if (miterLen > maxMiter + 1e-6) {
      out.push([(prev.b[0] + cur.a[0]) / 2, (prev.b[1] + cur.a[1]) / 2]);
    } else {
      out.push(hit);
    }
  }
  return dedupePts(out);
}

/** 圆弧折线；步数随半径与张角加密，拇指口/插舌圆角才够圆 */
function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, steps?: number): Pt[] {
  const span = Math.abs(a1 - a0);
  const n = steps ?? Math.max(32, Math.ceil(Math.max(r, 1) * span * 2));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = a0 + (a1 - a0) * (i / n);
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts;
}

/**
 * 拇指口工艺弧：与水平线 y = yEdge+offset 相交的同心圆，避免 90° 斜接上溢。
 * offset>0：向面板内（margin，半径变大）。
 */
function thumbNotchGuidePts(
  cx: number,
  yEdge: number,
  rCut: number,
  offset: number,
): Pt[] {
  const R = rCut + offset;
  if (!(Math.abs(R) > Math.abs(offset) + 0.1)) return [];
  const disc = R * R - offset * offset;
  if (disc <= 1e-6) return [];
  const half = Math.sqrt(disc);
  const a0 = Math.atan2(offset, -half);
  const a1 = Math.atan2(offset, half);
  return arcPts(cx, yEdge, R, a0, a1);
}

/**
 * 派生尺寸（对照 BODA 截图 / 100×100×20）：
 * - glue 粘边 16；tongue/dust ≈ 0.85·D
 * - tongueR：舌顶大圆角；舌宽与盖宽一致
 * - notch：正面拇指口半径
 */
function tuckMetrics(w: number, h: number, d: number) {
  const glue = 16;
  const tongue = Math.min(20, Math.max(14, Math.round(d * 0.85 * 10) / 10));
  const dust = Math.min(tongue, Math.max(8, Math.round(d * 0.85 * 10) / 10));
  const taperDust = Math.min(3, Math.max(1.5, Math.round(d * 0.125 * 10) / 10));
  const taperGlue = Math.min(5, Math.max(3, h * 0.05));
  const tongueR = Math.min(tongue - 2, w / 2 - 1, Math.max(6, tongue * 0.45));
  const notchRaw = Math.min(10, w / 10, h / 10);
  const notch = notchRaw >= 5 ? notchRaw : 0;
  return {
    glue,
    tongue,
    dust,
    taperDust,
    tongueR,
    taperGlue,
    notch,
  };
}

function marginRect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  if (w <= SAFE * 2 || h <= SAFE * 2) return;
  strokeGuide(doc, 'margin');
  doc.rect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE);
}

/**
 * 构建刀线外轮廓 + 折线 + 插舌/拇指口 margin 轮廓（对照 BODA）。
 * x0 / yBack：左侧面左上主身角；y 向下。
 */
function buildTuckbox(x0: number, yBack: number, w: number, h: number, d: number) {
  const m = tuckMetrics(w, h, d);
  const s1x = x0;
  const backX = x0 + d;
  const s2x = x0 + d + w;
  const frontX = x0 + 2 * d + w;
  const glueX = x0 + 2 * d + 2 * w;
  const y0 = yBack;
  const y1 = yBack + h;
  const yLidTop = y0 - d;
  const yTongueTop = yLidTop - m.tongue;
  const yLidBot = y1 + d;
  const yTongueBot = yLidBot + m.tongue;
  const yDustTop = y0 - m.dust;
  const yDustBot = y1 + m.dust;
  const notchCx = frontX + w / 2;
  const r = m.tongueR;

  const pts: Pt[] = [];
  const add = (...more: Pt[]) => {
    more.forEach((p) => pts.push(p));
  };

  // —— 刀线外轮廓（含防尘翼凹角），插舌宽与盖宽一致 ——
  // 左上防尘翼
  add([s1x, y0]);
  add([s1x + m.taperDust, yDustTop]);
  add([s1x + d - m.taperDust, yDustTop]);
  add([backX, y0]);
  add([backX, yLidTop]);

  // 上插舌：竖直盖边 → 顶大圆角
  add([backX, yTongueTop + r]);
  if (r > 0.5) {
    add(...arcPts(backX + r, yTongueTop + r, r, Math.PI, Math.PI * 1.5).slice(1));
  }
  add([backX + w - r, yTongueTop]);
  if (r > 0.5) {
    add(...arcPts(backX + w - r, yTongueTop + r, r, Math.PI * 1.5, Math.PI * 2).slice(1));
  }
  add([backX + w, yLidTop]);

  // 右上防尘翼 → 正面拇指口 → 粘边
  add([s2x, y0]);
  add([s2x + m.taperDust, yDustTop]);
  add([s2x + d - m.taperDust, yDustTop]);
  add([frontX, y0]);
  if (m.notch > 0) {
    add([notchCx - m.notch, y0]);
    add(...arcPts(notchCx, y0, m.notch, Math.PI, 0).slice(1));
  }
  add([glueX, y0]);
  add([glueX + m.glue, y0 + m.taperGlue]);
  add([glueX + m.glue, y1 - m.taperGlue]);
  add([glueX, y1]);
  add([frontX, y1]);

  // 右下防尘翼
  add([s2x + d - m.taperDust, yDustBot]);
  add([s2x + m.taperDust, yDustBot]);
  add([s2x, y1]);
  add([backX + w, yLidBot]);

  // 下插舌（与上对称）
  add([backX + w, yTongueBot - r]);
  if (r > 0.5) {
    add(...arcPts(backX + w - r, yTongueBot - r, r, 0, Math.PI / 2).slice(1));
  }
  add([backX + r, yTongueBot]);
  if (r > 0.5) {
    add(...arcPts(backX + r, yTongueBot - r, r, Math.PI / 2, Math.PI).slice(1));
  }
  add([backX, yLidBot]);
  add([backX, y1]);

  // 左下防尘翼
  add([s1x + d - m.taperDust, yDustBot]);
  add([s1x + m.taperDust, yDustBot]);
  add([s1x, y1]);

  // —— Outer Bleed 源：跳过防尘翼/盖凹角，避免外扩交叉超出 ——
  const bleedSrc: Pt[] = [];
  const addB = (...more: Pt[]) => {
    more.forEach((p) => bleedSrc.push(p));
  };
  // 左上：防尘翼顶水平桥到 backX，再竖直向上（不折进 [backX,y0]）
  addB([s1x, y0]);
  addB([s1x + m.taperDust, yDustTop]);
  addB([backX, yDustTop]);
  addB([backX, yTongueTop + r]);
  if (r > 0.5) {
    addB(...arcPts(backX + r, yTongueTop + r, r, Math.PI, Math.PI * 1.5).slice(1));
  }
  addB([backX + w - r, yTongueTop]);
  if (r > 0.5) {
    addB(...arcPts(backX + w - r, yTongueTop + r, r, Math.PI * 1.5, Math.PI * 2).slice(1));
  }
  // 右上：竖直桥到防尘翼顶
  addB([backX + w, yDustTop]);
  addB([s2x + m.taperDust, yDustTop]);
  addB([s2x + d - m.taperDust, yDustTop]);
  addB([frontX, y0]);
  // 拇指口：bleed 直线跨过，不跟半圆
  addB([glueX, y0]);
  addB([glueX + m.glue, y0 + m.taperGlue]);
  addB([glueX + m.glue, y1 - m.taperGlue]);
  addB([glueX, y1]);
  addB([frontX, y1]);
  // 右下
  addB([s2x + d - m.taperDust, yDustBot]);
  addB([s2x + m.taperDust, yDustBot]);
  addB([backX + w, yDustBot]);
  addB([backX + w, yTongueBot - r]);
  if (r > 0.5) {
    addB(...arcPts(backX + w - r, yTongueBot - r, r, 0, Math.PI / 2).slice(1));
  }
  addB([backX + r, yTongueBot]);
  if (r > 0.5) {
    addB(...arcPts(backX + r, yTongueBot - r, r, Math.PI / 2, Math.PI).slice(1));
  }
  // 左下
  addB([backX, yDustBot]);
  addB([s1x + d - m.taperDust, yDustBot]);
  addB([s1x + m.taperDust, yDustBot]);
  addB([s1x, y1]);

  // 内部折线（面板分界 + 盖/舌分界 + 防尘翼根）
  const folds: [Pt, Pt][] = [
    [[backX, y0], [backX, y1]],
    [[s2x, y0], [s2x, y1]],
    [[frontX, y0], [frontX, y1]],
    [[glueX, y0], [glueX, y1]],
    [[backX, y0], [backX + w, y0]],
    [[backX, yLidTop], [backX + w, yLidTop]],
    [[backX, y1], [backX + w, y1]],
    [[backX, yLidBot], [backX + w, yLidBot]],
    [[s1x, y0], [backX, y0]],
    [[s2x, y0], [frontX, y0]],
    [[s1x, y1], [backX, y1]],
    [[s2x, y1], [frontX, y1]],
  ];

  // 正面 margin：直接内收，拇指口用同心弧交点（避免 90° 斜接上溢）
  const frontMargin: Pt[] = [];
  const addF = (...more: Pt[]) => {
    more.forEach((p) => frontMargin.push(p));
  };
  const xML = frontX + SAFE;
  const xMR = glueX - SAFE;
  const yMT = y0 + SAFE;
  const yMB = y1 - SAFE;
  addF([xML, yMT]);
  if (m.notch > SAFE) {
    addF(...thumbNotchGuidePts(notchCx, y0, m.notch, SAFE));
  }
  addF([xMR, yMT]);
  addF([xMR, yMB]);
  addF([xML, yMB]);

  return {
    m,
    pts,
    folds,
    bleedSrc,
    frontMargin,
    coords: { s1x, backX, s2x, frontX, glueX, y0, y1, yLidTop, yLidBot },
  };
}

function drawTuckboxMargins(
  doc: jsPDF,
  layout: ReturnType<typeof buildTuckbox>,
  w: number,
  h: number,
  d: number,
) {
  const { coords } = layout;
  const { s1x, backX, s2x, y0, y1, yLidTop } = coords;

  // 主面板矩形 margin（防尘翼、上下插舌不画）
  marginRect(doc, s1x, y0, d, h);
  marginRect(doc, backX, y0, w, h);
  marginRect(doc, s2x, y0, d, h);
  marginRect(doc, backX, yLidTop, w, d);
  marginRect(doc, backX, y1, w, d);

  // 正面（拇指口已按同心弧内收，直接描）
  if (w > SAFE * 2 && h > SAFE * 2) {
    strokeGuide(doc, 'margin');
    poly(doc, layout.frontMargin);
  }
}

export function generateTuckboxPdf(
  input: { x: number; y: number; z: number; cards?: number },
  logoDataUrl: string,
) {
  const w = input.x;
  const h = input.y;
  const d = input.z;
  const m0 = tuckMetrics(w, h, d);
  const title = 'Tuckbox Template';
  const subtitle = input.cards
    ? `${w}mm x ${h}mm - ${input.cards} cards`
    : `${w}mm x ${h}mm x ${formatMm(d)}mm`;

  const netW = 2 * w + 2 * d + m0.glue;
  const netH = h + 2 * d + 2 * m0.tongue;

  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = Math.max(
    netW + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle),
  );
  const pageH = HEADER + netH + 2 * BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const x0 = (pageW - netW) / 2;
  const yBack = HEADER + BLEED + m0.tongue + d;
  const layout = buildTuckbox(x0, yBack, w, h, d);

  drawHeader(doc, { pageW, logoDataUrl, title, subtitle });
  drawLegend(doc, pageW - LEGEND_W, 9);

  // Outer Bleed：桥接凹角后外扩；拇指口保持直线（不跟半圆）
  strokeGuide(doc, 'bleed');
  poly(doc, offsetPolygon(layout.bleedSrc, BLEED, 1.5));

  // Margin：各面板内收
  drawTuckboxMargins(doc, layout, w, h, d);

  // Fold/Dieline
  strokeGuide(doc, 'dieline');
  poly(doc, layout.pts);
  layout.folds.forEach(([a, b]) => doc.line(a[0], a[1], b[0], b[1]));

  return doc;
}

export async function downloadTuckboxPdf(input: {
  x: number;
  y: number;
  z: number;
  cards?: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateTuckboxPdf(input, logoDataUrl);
  doc.save(tuckboxPdfFileName(input));
}

/** 生成并在新标签页打开 PDF（开发预览 tuckbox 时用） */
export async function openTuckboxPdf(input: {
  x: number;
  y: number;
  z: number;
  cards?: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateTuckboxPdf(input, logoDataUrl);
  const url = String(doc.output('bloburl'));
  window.open(url, '_blank', 'noopener,noreferrer');
}
