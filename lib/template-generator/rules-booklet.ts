import { jsPDF } from 'jspdf';
import { drawHeader, drawLegend, headerMinPageWidth, loadLogoDataUrl } from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, strokeGuide, openPdfDoc } from './style';

export function bookletInsets(outside: number, spine: number) {
  const out = Number.isFinite(outside) && outside > 0 ? outside : 0;
  const sp = Number.isFinite(spine) && spine > 0 ? spine : 0;
  if (out === 0 && sp === 0) return { out: SAFE, sp: SAFE };
  return { out, sp };
}

export function rulesBookletPdfFileName(
  w: number,
  h: number,
  outside: number,
  spine: number,
) {
  const extras =
    outside > 0 || spine > 0 ? `o${outside}s${spine}` : '';
  return `RulesBooklet${w}x${h}${extras}mm.pdf`;
}

function drawPageMargin(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  left: number,
  right: number,
  top: number,
  bottom: number,
) {
  const iw = w - left - right;
  const ih = h - top - bottom;
  if (iw <= 0 || ih <= 0) return;
  strokeGuide(doc, 'margin');
  doc.rect(x + left, y + top, iw, ih);
}

export function generateRulesBookletPdf(
  input: { x: number; y: number; outside: number; spine: number },
  logoDataUrl: string,
) {
  const pageW = input.x;
  const pageH = input.y;
  const { out, sp } = bookletInsets(input.outside, input.spine);
  const spreadW = pageW * 2;
  const title = 'Rules Booklet Template';
  const subtitle =
    input.outside > 0 || input.spine > 0
      ? `${pageW}mm x ${pageH}mm / outside ${input.outside}mm / spine ${input.spine}mm`
      : `${pageW}mm x ${pageH}mm`;

  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const canvasW = Math.max(
    spreadW + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle),
  );
  const canvasH = HEADER + pageH + 2 * BLEED + PAD;
  doc.addPage([canvasW, canvasH], canvasW >= canvasH ? 'l' : 'p');

  const bx = (canvasW - spreadW) / 2;
  const by = HEADER + BLEED;

  drawHeader(doc, {
    pageW: canvasW,
    logoDataUrl,
    title,
    subtitle,
  });
  drawLegend(doc, canvasW - LEGEND_W, 9);

  strokeGuide(doc, 'bleed');
  doc.rect(bx - BLEED, by - BLEED, spreadW + 2 * BLEED, pageH + 2 * BLEED);

  strokeGuide(doc, 'dieline');
  doc.rect(bx, by, spreadW, pageH);

  strokeGuide(doc, 'dieline');
  doc.line(bx + pageW, by, bx + pageW, by + pageH);

  drawPageMargin(doc, bx, by, pageW, pageH, out, sp, out, out);
  drawPageMargin(doc, bx + pageW, by, pageW, pageH, sp, out, out, out);

  return doc;
}

export async function downloadRulesBookletPdf(input: {
  x: number;
  y: number;
  outside: number;
  spine: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateRulesBookletPdf(input, logoDataUrl);
  openPdfDoc(doc);
}
