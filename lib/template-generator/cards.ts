import { jsPDF } from 'jspdf';
import {
  drawHeader,
  drawLegend,
  headerMinPageWidth,
  loadLogoDataUrl,
} from './logo';
import { BLEED, HEADER, LEGEND_W, PAD, SAFE, strokeGuide } from './style';

const CORNER = 3.5;

export type CardSizeGroup = 'common' | 'other';

export type CardSize = {
  id: string;
  w: number;
  h: number;
  perSheet: number;
  name?: string;
  inches?: string;
  group: CardSizeGroup;
};

export const CARD_SIZES: CardSize[] = [
  { id: '44x67', w: 44, h: 67, perSheet: 84, name: 'mini size', group: 'common' },
  {
    id: '57x87',
    w: 57,
    h: 87,
    perSheet: 60,
    name: 'bridge size',
    inches: '3.5 x 2.25in',
    group: 'common',
  },
  { id: '59x91', w: 59, h: 91, perSheet: 45, name: 'euro size', group: 'common' },
  {
    id: '63x88',
    w: 63,
    h: 88,
    perSheet: 54,
    name: 'blackjack size',
    inches: '3.5 x 2.5in',
    group: 'common',
  },
  { id: '70x70', w: 70, h: 70, perSheet: 56, name: 'square size', group: 'common' },
  { id: '70x110', w: 70, h: 110, perSheet: 32, name: 'tarot card size', group: 'common' },
  { id: '42x64', w: 42, h: 64, perSheet: 104, group: 'other' },
  { id: '51x51', w: 51, h: 51, perSheet: 110, name: 'mini square', group: 'other' },
  { id: '54x86', w: 54, h: 86, perSheet: 60, group: 'other' },
  { id: '56x87', w: 56, h: 87, perSheet: 60, group: 'other' },
  { id: '58x88', w: 58, h: 88, perSheet: 54, group: 'other' },
  { id: '58x89', w: 58, h: 89, perSheet: 54, group: 'other' },
  { id: '59x88', w: 59, h: 88, perSheet: 54, group: 'other' },
  { id: '63x63', w: 63, h: 63, perSheet: 72, group: 'other' },
  { id: '65x100', w: 65, h: 100, perSheet: 40, group: 'other' },
  { id: '70x100', w: 70, h: 100, perSheet: 40, group: 'other' },
  { id: '70x120', w: 70, h: 120, perSheet: 32, group: 'other' },
  { id: '80x80', w: 80, h: 80, perSheet: 42, group: 'other' },
  { id: '80x120', w: 80, h: 120, perSheet: 28, group: 'other' },
  { id: '89x89', w: 89, h: 89, perSheet: 30, group: 'other' },
];

export const DEFAULT_CARD_SIZE_ID = '63x88';

export function getCardSize(id: string) {
  return CARD_SIZES.find((item) => item.id === id) ?? CARD_SIZES[3];
}

export function cardOptionLabel(item: CardSize) {
  const dim = `${item.w} x ${item.h}mm`;
  const bits = [item.name, item.inches].filter(Boolean);
  const extra = bits.length ? ` (${bits.join(' - ')})` : '';
  return `${dim}${extra} - ${item.perSheet} / sheet`;
}

export function cardPreviewCaption(item: CardSize) {
  const tag = item.name?.replace(/ size$/i, '') ?? '';
  return tag ? `${item.w}mm x ${item.h}mm - ${tag}` : `${item.w}mm x ${item.h}mm`;
}

function cornerRadius(w: number, h: number) {
  return Math.min(CORNER, w / 4, h / 4);
}

function drawRoundedGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const r = cornerRadius(w, h);

  strokeGuide(doc, 'bleed');
  doc.roundedRect(
    x - BLEED,
    y - BLEED,
    w + 2 * BLEED,
    h + 2 * BLEED,
    r + BLEED,
    r + BLEED,
    'S',
  );

  strokeGuide(doc, 'dieline');
  doc.roundedRect(x, y, w, h, r, r, 'S');

  if (w > SAFE * 2 && h > SAFE * 2) {
    const ir = Math.max(0.5, r - SAFE);
    strokeGuide(doc, 'margin');
    doc.roundedRect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE, ir, ir, 'S');
  }
}

export function cardsPdfFileName(w: number, h: number) {
  return `Cards${w}x${h}mm.pdf`;
}

export function generateCardsPdf(
  input: { w: number; h: number; perSheet?: number },
  logoDataUrl: string,
) {
  const { w, h, perSheet } = input;
  const extra = perSheet ? `${perSheet} / sheet` : undefined;
  const title = 'Cards Template';
  const subtitle = `${w}mm x ${h}mm`;

  const doc = new jsPDF({ unit: 'mm', format: [10, 10], orientation: 'p' });
  doc.deletePage(1);

  const pageW = Math.max(
    w + 2 * BLEED + 2 * PAD,
    headerMinPageWidth(doc, title, subtitle, extra),
  );
  const pageH = HEADER + h + 2 * BLEED + PAD;
  doc.addPage([pageW, pageH], pageW >= pageH ? 'l' : 'p');

  const bx = (pageW - w) / 2;
  const by = HEADER + BLEED;

  drawHeader(doc, {
    pageW,
    logoDataUrl,
    title,
    subtitle,
    extra,
    align: 'left',
  });
  drawLegend(doc, pageW - LEGEND_W, 9);

  drawRoundedGuides(doc, bx, by, w, h);

  return doc;
}

export async function downloadCardsPdf(input: {
  w: number;
  h: number;
  perSheet?: number;
}) {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = generateCardsPdf(input, logoDataUrl);
  doc.save(cardsPdfFileName(input.w, input.h));
}
