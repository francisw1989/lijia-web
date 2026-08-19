import type { jsPDF } from 'jspdf';

const LOGO_SRC = '/images/logo-2.png';
const LOGO_W = 12;
const LOGO_H = (12 * 216) / 211;
const LOGO_X = 6;
const LOGO_Y = 4;

let cached: string | null = null;

/** 4-bit 索引 PNG jsPDF 解不开，先转成标准 RGBA PNG */
async function loadLogoDataUrl() {
  if (cached) return cached;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not load PDF logo'));
    el.src = LOGO_SRC;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw PDF logo');
  ctx.drawImage(img, 0, 0);

  cached = canvas.toDataURL('image/png');
  return cached;
}

/** 在每一页左上角盖上 LIJIA logo */
export async function stampLogoOnPages(doc: jsPDF) {
  const dataUrl = await loadLogoDataUrl();
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i += 1) {
    doc.setPage(i);
    doc.addImage(dataUrl, 'PNG', LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
  }
}
