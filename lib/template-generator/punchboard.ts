import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, loadLogoDataUrl } from './logo';
import { BLEED, drawRectGuides, HEADER, LEGEND_W, PAD, SAFE, strokeGuide } from './style';

const SAMPLE = 20;
const SAMPLE_GAP = 8;
const SAMPLE_INSET = 8;

function drawCircleGuides(doc: jsPDF, cx: number, cy: number, r: number) {
  strokeGuide(doc, 'bleed');
  doc.circle(cx, cy, r + BLEED, 'S');

  strokeGuide(doc, 'dieline');
  doc.circle(cx, cy, r, 'S');

  if (r > SAFE) {
    strokeGuide(doc, 'margin');
    doc.circle(cx, cy, r - SAFE, 'S');
  }
}

function drawSamples(doc: jsPDF, bx: number, by: number, bw: number, bh: number) {
  const r = SAMPLE / 2;
  const minW = SAMPLE_INSET * 2 + BLEED * 4 + SAMPLE * 2 + SAMPLE_GAP;
  const minH = SAMPLE_INSET * 2 + BLEED * 2 + SAMPLE;
  if (bw < minW || bh < minH) return;

  const circleCx = bx + bw - SAMPLE_INSET - BLEED - r;
  const circleCy = by + bh - SAMPLE_INSET - BLEED - r;
  const sqX = circleCx - r - BLEED - SAMPLE_GAP - BLEED - SAMPLE;
  const sqY = by + bh - SAMPLE_INSET - BLEED - SAMPLE;

  drawRectGuides(doc, sqX, sqY, SAMPLE, SAMPLE);
  drawCircleGuides(doc, circleCx, circleCy, r);
}

export function punchboardPdfFileName(x: number, y: number) {
  return `Punchboard${x}x${y}mm.pdf`;
}

export function generatePunchboardPdf(
  input: { x: number; y: number },
  logoDataUrl: string,
) {
  const { x: bw, y: bh } = input;
  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = bw + 2 * BLEED + 2 * PAD;
  const pageH = HEADER + bh + 2 * BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const bx = (pageW - bw) / 2;
  const by = HEADER + BLEED;

  drawHeader(doc, {
    pageW,
    logoDataUrl,
    title: 'Punchboard Template',
    subtitle: `${bw}mm x ${bh}mm`,
  });
  drawLegend(doc, pageW - LEGEND_W, 9);

  drawRectGuides(doc, bx, by, bw, bh);
  drawSamples(doc, bx, by, bw, bh);

  return doc;
}

export async function downloadPunchboardPdf(input: { x: number; y: number }) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generatePunchboardPdf(input, logoDataUrl);
  doc.save(punchboardPdfFileName(input.x, input.y));
}
