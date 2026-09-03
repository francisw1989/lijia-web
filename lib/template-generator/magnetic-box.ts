import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, WRAP, strokeGuide, openPdfDoc } from './style';

export const MAGNETIC_THICKNESSES = [
  { mm: 1.2, label: '1.2 mm' },
  { mm: 1.5, label: '1.5 mm' },
  { mm: 2, label: '2 mm' },
] as const;

export type MagneticThicknessMm = (typeof MAGNETIC_THICKNESSES)[number]['mm'];

type Pt = [number, number];

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

function dedupePts(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  pts.forEach((p) => {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-6) out.push(p);
  });
  return out;
}

/** 多边形外扩；斜接过 long 时在凹角处改为斜切，避免 bleed 自交 */
function offsetPolygonOutward(pts: Pt[], dist: number, miterLimit = 2.5): Pt[] {
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

function formatMm(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function materialToken(mm: number) {
  return Number.isInteger(mm) ? String(mm) : String(mm).replace('.', '');
}

function marginRect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  if (w <= SAFE * 2 || h <= SAFE * 2) return;
  strokeGuide(doc, 'margin');
  doc.rect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE);
}

/** 外径→内径（对照 BODA：100×100×20 / 1.5 → 89×93×14.5；/ 2 → 88×91×13） */
export function magneticInnerSize(a: number, b: number, c: number, t: number) {
  return {
    a: Math.max(1, a - 2 * t - 8),
    b: Math.max(1, b - 4 * t - 1),
    c: Math.max(1, c - 3 * t - 1),
  };
}

export function magneticBoxPdfFileName(a: number, b: number, c: number, t: number) {
  return `MagneticBox-${materialToken(t)}_${a}x${b}x${c}mm.pdf`;
}

function shrinkFold(n: number, t: number, layers = 1) {
  return Math.max(1, n - 2 * t * layers);
}

function miterWrapOutline(netW: number, netH: number, wrap: number): Pt[] {
  wrap = wrap + 20
  return [
    [wrap, 0],
    [netW - wrap, 0],
    [netW, wrap],
    [netW, netH - wrap],
    [netW - wrap, netH],
    [wrap, netH],
    [0, netH - wrap],
    [0, wrap],
  ];
}

/** 顶/底耳朵外缘短竖边长度 */
function trayEarStraight(wing: number, d: number) {
  return Math.min(Math.max(4, d * 0.35), wing * 0.45);
}

/**
 * Bleed 源：耳朵外侧用直角（竖 + 横）桥接，不跟斜边，避免外扩出斜线
 */
function trayBleedSource(w: number, h: number, d: number, wrap: number): Pt[] {
  const { left, right, top, bottom } = trayExtents(w, h, d, wrap);
  const wing = Math.max(8, d * 0.8);
  return [
    [0, -top],
    [w, -top],
    [w, -d],
    [w + wing, -d],
    [w + wing, 0],
    [w + right, 0],
    [w + right, h],
    [w + wing, h],
    [w + wing, h + d],
    [w, h + d],
    [w, h + bottom],
    [0, h + bottom],
    [0, h + d],
    [-wing, h + d],
    [-wing, h],
    [-left, h],
    [-left, 0],
    [-wing, 0],
    [-wing, -d],
    [0, -d],
  ];
}

/** 顶/底耳朵：水平外伸 → 外缘短竖边 → 斜切回折线（对照 BODA） */
function trayEarPts(
  foldX: number,
  foldY0: number,
  foldY1: number,
  wing: number,
  d: number,
  dir: 1 | -1,
  fromFoldEnd: boolean,
): Pt[] {
  const earStraight = trayEarStraight(wing, d);
  const outerX = foldX + dir * wing;
  const down = foldY1 > foldY0;
  const outerY = down ? foldY0 + earStraight : foldY0 - earStraight;
  if (fromFoldEnd) {
    return [
      [outerX, outerY],
      [outerX, foldY0],
      [foldX, foldY0],
    ];
  }
  return [
    [outerX, foldY0],
    [outerX, outerY],
    [foldX, foldY1],
  ];
}

function trayExtents(w: number, h: number, d: number, wrap: number) {
  const lip = Math.max(6, Math.min(8, d * 0.55));
  // 左/右：d|d|外条（左 lip，右 wrap）；上/下同结构，最外段均为 lip（与左对称）
  const left = 2 * d + lip;
  const right = 2 * d + wrap;
  const top = 2 * d + lip;
  const bottom = 2 * d + lip;
  return { left, right, top, bottom, lip };
}

function trayOutline(w: number, h: number, d: number, wrap: number): Pt[] {
  const { left: leftSide, right: rightSide, top: topEnd, bottom: bottomEnd } = trayExtents(
    w,
    h,
    d,
    wrap,
  );
  const wing = Math.max(8, d * 0.8);
  return [
    [0, -topEnd],
    [w, -topEnd],
    [w, -d],
    ...trayEarPts(w, -d, 0, wing, d, 1, false),
    [w + rightSide, 0],
    [w + rightSide, h],
    [w, h],
    ...trayEarPts(w, h + d, h, wing, d, 1, true),
    [w, h + d],
    [w, h + bottomEnd],
    [0, h + bottomEnd],
    [0, h + d],
    ...trayEarPts(0, h + d, h, wing, d, -1, false),
    [0, h],
    [-leftSide, h],
    [-leftSide, 0],
    [0, 0],
    ...trayEarPts(0, -d, 0, wing, d, -1, true),
    [0, -d],
    [0, -topEnd],
  ];
}

function beginPage(
  doc: jsPDF,
  opts: {
    netW: number;
    netH: number;
    title: string;
    subtitle: string;
    extra: string;
    logoDataUrl: string;
  },
) {
  const pageW = Math.max(
    opts.netW + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, opts.title, opts.subtitle, opts.extra),
  );
  const oy = HEADER + BLEED;
  const pageH = oy + opts.netH + BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');
  drawHeader(doc, {
    pageW,
    logoDataUrl: opts.logoDataUrl,
    title: opts.title,
    subtitle: opts.subtitle,
    extra: opts.extra,
  });
  drawLegend(doc, pageW - LEGEND_W, 9);
  return { pageW, ox: (pageW - opts.netW) / 2, oy };
}

function drawPart1(
  doc: jsPDF,
  a: number,
  b: number,
  c: number,
  subtitle: string,
  extra: string,
  logoDataUrl: string,
) {
  const panels = [a, c, a, c];
  const innerW = panels.reduce((sum, n) => sum + n, 0);
  const netW = innerW + 2 * WRAP + 10;
  const netH = b + 2 * WRAP + 10;
  const { ox, oy } = beginPage(doc, {
    netW,
    netH,
    title: 'Magnetic Box Template - Part 1/4',
    subtitle,
    extra,
    logoDataUrl,
  });
  const shift = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x + ox, y + oy]);
  const cut = shift(miterWrapOutline(netW, netH, WRAP));

  strokeGuide(doc, 'dieline');
  poly(doc, cut);

  const y0 = oy + WRAP + 5;
  let x = ox + WRAP + 5;
  strokeGuide(doc, 'dieline');
  doc.line(x, y0, x + innerW, y0);
  doc.line(x, y0 + b, x + innerW, y0 + b);
  panels.forEach((w) => {
    doc.line(x, y0, x, y0 + b);
    marginRect(doc, x, y0, w, b);
    x += w;
    strokeGuide(doc, 'dieline');
  });
  doc.line(x, y0, x, y0 + b);

  strokeGuide(doc, 'bleed');
  poly(doc, offsetPolygonOutward(cut, BLEED));
}

function drawPart2(
  doc: jsPDF,
  a: number,
  b: number,
  c: number,
  t: number,
  subtitle: string,
  extra: string,
  logoDataUrl: string,
) {
  // 宽度与 Part 1 折线区相同（c | a | c+WRAP），仅高度矮 2×厚度
  const leftW = c;
  const midW = a;
  const flap = c + WRAP;
  const netW = leftW + midW + flap;
  const netH = shrinkFold(b, t);
  const { ox, oy } = beginPage(doc, {
    netW,
    netH,
    title: 'Magnetic Box Template - Part 2/4',
    subtitle,
    extra,
    logoDataUrl,
  });

  strokeGuide(doc, 'dieline');
  doc.rect(ox, oy, netW, netH);
  doc.line(ox + leftW, oy, ox + leftW, oy + netH);
  doc.line(ox + leftW + midW, oy, ox + leftW + midW, oy + netH);

  marginRect(doc, ox, oy, leftW, netH);
  marginRect(doc, ox + leftW, oy, midW, netH);

  strokeGuide(doc, 'bleed');
  doc.rect(ox - BLEED, oy - BLEED, netW + 2 * BLEED, netH + 2 * BLEED);
}

function drawPart3(
  doc: jsPDF,
  a: number,
  b: number,
  t: number,
  subtitle: string,
  extra: string,
  logoDataUrl: string,
) {
  // 相对 Part 2 中面板（宽 a、高 b-2t）再各缩 2×厚度
  const netW = shrinkFold(a, t);
  const netH = shrinkFold(b, t, 2);
  const { ox, oy } = beginPage(doc, {
    netW,
    netH,
    title: 'Magnetic Box Template - Part 3/4',
    subtitle,
    extra,
    logoDataUrl,
  });

  strokeGuide(doc, 'dieline');
  doc.rect(ox, oy, netW, netH);
  marginRect(doc, ox, oy, netW, netH);
  strokeGuide(doc, 'bleed');
  doc.rect(ox - BLEED, oy - BLEED, netW + 2 * BLEED, netH + 2 * BLEED);
}

function drawPart4(
  doc: jsPDF,
  w: number,
  h: number,
  d: number,
  subtitle: string,
  extra: string,
  logoDataUrl: string,
) {
  const cutLocal = trayOutline(w, h, d, WRAP);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  cutLocal.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  const netW = maxX - minX;
  const netH = maxY - minY;
  const { ox: originX, oy: originY } = beginPage(doc, {
    netW,
    netH,
    title: 'Magnetic Box Template - Part 4/4',
    subtitle,
    extra,
    logoDataUrl,
  });
  const ox = originX - minX;
  const oy = originY - minY;
  const shift = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x + ox, y + oy]);
  const cut = shift(cutLocal);

  strokeGuide(doc, 'dieline');
  poly(doc, cut);

  const x0 = ox;
  const y0 = oy;
  strokeGuide(doc, 'dieline');
  doc.rect(x0, y0, w, h);
  // 左：d | d | lip
  doc.line(x0 - d, y0, x0 - d, y0 + h);
  doc.line(x0 - 2 * d, y0, x0 - 2 * d, y0 + h);
  // 右：d | d | wrap
  doc.line(x0 + w + d, y0, x0 + w + d, y0 + h);
  doc.line(x0 + w + 2 * d, y0, x0 + w + 2 * d, y0 + h);
  // 上/下：d | d | lip（最外段与左侧一致）
  doc.line(x0, y0 - d, x0 + w, y0 - d);
  doc.line(x0, y0 - 2 * d, x0 + w, y0 - 2 * d);
  doc.line(x0, y0 + h + d, x0 + w, y0 + h + d);
  doc.line(x0, y0 + h + 2 * d, x0 + w, y0 + h + 2 * d);
  // 顶底与侧板交接折线
  doc.line(x0, y0 - d, x0, y0);
  doc.line(x0 + w, y0 - d, x0 + w, y0);
  doc.line(x0, y0 + h, x0, y0 + h + d);
  doc.line(x0 + w, y0 + h, x0 + w, y0 + h + d);

  // Bleed：耳朵外廓 + 四角桥接后外扩，避免凹角自交
  strokeGuide(doc, 'bleed');
  poly(doc, offsetPolygonOutward(shift(trayBleedSource(w, h, d, WRAP)), BLEED, 1.5));
}

export function generateMagneticBoxPdf(
  input: { a: number; b: number; c: number; thickness: number },
  logoDataUrl: string,
) {
  const { a, b, c, thickness: t } = input;
  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const subtitle = `${a}mm x ${b}mm x ${c}mm / thickness - ${t}mm`;
  const inner = magneticInnerSize(a, b, c, t);
  const extra = `Inner size: ${formatMm(inner.a)}mm x ${formatMm(inner.b)}mm x ${formatMm(inner.c)}mm`;

  drawPart1(doc, a, b, c, subtitle, extra, logoDataUrl);
  drawPart2(doc, a, b, c, t, subtitle, extra, logoDataUrl);
  drawPart3(doc, a, b, t, subtitle, extra, logoDataUrl);
  drawPart4(doc, inner.a, inner.b, inner.c, subtitle, extra, logoDataUrl);

  return doc;
}

export async function downloadMagneticBoxPdf(input: {
  a: number;
  b: number;
  c: number;
  thickness: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateMagneticBoxPdf(input, logoDataUrl);
  openPdfDoc(doc);
}

