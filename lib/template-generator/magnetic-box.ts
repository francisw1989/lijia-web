import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, WRAP, strokeGuide } from './style';

export const MAGNETIC_THICKNESSES = [
  { mm: 1.2, label: '1.2 mm' },
  { mm: 1.5, label: '1.5 mm' },
  { mm: 2, label: '2 mm' },
] as const;

export type MagneticThicknessMm = (typeof MAGNETIC_THICKNESSES)[number]['mm'];

/**
 * Part 1 外包边翻边 / 斜角边长（对照 BODA「提前拐弯」）：
 * 斜角约占外包络高度 ~20%，且明显长于侧板。
 */
function magWrap(b: number, c: number) {
  return Math.max(Math.round(c * 2.5), Math.round(b * 0.45));
}

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

function offsetPolygonOutward(pts: Pt[], dist: number): Pt[] {
  const n = pts.length;
  if (n < 3) return pts;
  const s = shoelace(pts) > 0 ? -1 : 1;
  const shifted: { a: Pt; b: Pt }[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
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
  for (let i = 0; i < n; i += 1) {
    const prev = shifted[(i - 1 + n) % n];
    const cur = shifted[i];
    out.push(lineIntersect(prev.a, prev.b, cur.a, cur.b));
  }
  return out;
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

function miterWrapOutline(netW: number, netH: number, wrap: number): Pt[] {
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

function trayOutline(w: number, h: number, d: number, wrap: number): Pt[] {
  const side = 2 * d + wrap;
  const lip = Math.max(6, Math.min(8, d * 0.55));
  const end = d + lip;
  const wing = Math.max(8, d * 0.8);
  const c = Math.min(5, wing * 0.3);
  const lc = Math.min(4, lip * 0.5);
  return [
    [lc, -end],
    [w - lc, -end],
    [w, -end + lc],
    [w, -d],
    [w + wing - c, -d],
    [w + wing, -d + c],
    [w, 0],
    [w + side, 0],
    [w + side, h],
    [w, h],
    [w + wing, h + d - c],
    [w + wing - c, h + d],
    [w, h + d],
    [w, h + end - lc],
    [w - lc, h + end],
    [lc, h + end],
    [0, h + end - lc],
    [0, h + d],
    [-wing + c, h + d],
    [-wing, h + d - c],
    [0, h],
    [-side, h],
    [-side, 0],
    [0, 0],
    [-wing, -d + c],
    [-wing + c, -d],
    [0, -d],
    [0, -end + lc],
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
  const wrap = magWrap(b, c);
  const netW = innerW + 2 * wrap;
  const netH = b + 2 * wrap;
  const { ox, oy } = beginPage(doc, {
    netW,
    netH,
    title: 'Magnetic Box Template - Part 1/4',
    subtitle,
    extra,
    logoDataUrl,
  });
  const shift = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x + ox, y + oy]);
  const cut = shift(miterWrapOutline(netW, netH, wrap));

  strokeGuide(doc, 'dieline');
  poly(doc, cut);

  const y0 = oy + wrap;
  let x = ox + wrap;
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
  subtitle: string,
  extra: string,
  logoDataUrl: string,
) {
  const flap = WRAP;
  const netW = c + a + flap;
  const netH = b;
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
  doc.line(ox + c, oy, ox + c, oy + b);
  doc.line(ox + c + a, oy, ox + c + a, oy + b);

  marginRect(doc, ox, oy, c, b);
  marginRect(doc, ox + c, oy, a, b);

  strokeGuide(doc, 'bleed');
  doc.rect(ox - BLEED, oy - BLEED, netW + 2 * BLEED, netH + 2 * BLEED);
}

function drawPart3(
  doc: jsPDF,
  a: number,
  b: number,
  subtitle: string,
  extra: string,
  logoDataUrl: string,
) {
  const { ox, oy } = beginPage(doc, {
    netW: a,
    netH: b,
    title: 'Magnetic Box Template - Part 3/4',
    subtitle,
    extra,
    logoDataUrl,
  });

  strokeGuide(doc, 'dieline');
  doc.rect(ox, oy, a, b);
  marginRect(doc, ox, oy, a, b);
  strokeGuide(doc, 'bleed');
  doc.rect(ox - BLEED, oy - BLEED, a + 2 * BLEED, b + 2 * BLEED);
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
  doc.line(x0 - d, y0, x0 - d, y0 + h);
  doc.line(x0 - 2 * d, y0, x0 - 2 * d, y0 + h);
  doc.line(x0 + w + d, y0, x0 + w + d, y0 + h);
  doc.line(x0 + w + 2 * d, y0, x0 + w + 2 * d, y0 + h);
  doc.line(x0, y0 - d, x0 + w, y0 - d);
  doc.line(x0, y0 + h + d, x0 + w, y0 + h + d);
  doc.line(x0, y0 - d, x0, y0);
  doc.line(x0 + w, y0 - d, x0 + w, y0);
  doc.line(x0, y0 + h, x0, y0 + h + d);
  doc.line(x0 + w, y0 + h, x0 + w, y0 + h + d);

  marginRect(doc, x0, y0, w, h);
  marginRect(doc, x0, y0 - d, w, d);
  marginRect(doc, x0, y0 + h, w, d);
  marginRect(doc, x0 - d, y0, d, h);
  marginRect(doc, x0 + w, y0, d, h);

  strokeGuide(doc, 'bleed');
  poly(doc, offsetPolygonOutward(cut, BLEED));
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
  drawPart2(doc, a, b, c, subtitle, extra, logoDataUrl);
  drawPart3(doc, a, b, subtitle, extra, logoDataUrl);
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
  doc.save(magneticBoxPdfFileName(input.a, input.b, input.c, input.thickness));
}

/** 生成并在新标签页打开 PDF（开发预览 magnetic box 时用） */
export async function openMagneticBoxPdf(input: {
  a: number;
  b: number;
  c: number;
  thickness: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateMagneticBoxPdf(input, logoDataUrl);
  const url = String(doc.output('bloburl'));
  window.open(url, '_blank', 'noopener,noreferrer');
}
