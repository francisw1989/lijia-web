import type { jsPDF } from 'jspdf';
import { foldLines, type FoldId } from './folds';
import { isMobilePdfClient, isWeChatBrowser } from '@/lib/pdf-client';

export { isMobilePdfClient, isWeChatBrowser } from '@/lib/pdf-client';

/** 工艺尺寸（mm），各模板共用 */
export const BLEED = 3;
export const SAFE = 3;
export const WRAP = 15;
export const PAD = 40;
export const HEADER = 32;

export const HEADER_INSET = 10;
export const LEGEND_W = 52;
export const HEADER_LEGEND_GAP = 24;

export type Cmyk = readonly [number, number, number, number];
export type GuideKind = 'margin' | 'dieline' | 'bleed';

/**
 * 刀线视觉参数。改这里，Box / Board / Punchboard / Cards 一起变。
 * 绿虚线 Margin / 品红实线 Fold/Dieline / 青虚线 Outer Bleed
 */
export const GUIDE_WIDTH = 0.3;
export const DASH_ON = 1.6;
export const DASH_OFF = 1.1;
export const LEGEND_SWATCH_WIDTH = 0.9;

export const GUIDE = {
  margin: { color: [1, 0, 1, 0] as const, dashed: true },
  dieline: { color: [0, 1, 1, 0] as const, dashed: false },
  bleed: { color: [1, 0.55, 0, 0] as const, dashed: true },
} as const;

export function strokeGuide(doc: jsPDF, kind: GuideKind, width = GUIDE_WIDTH) {
  const g = GUIDE[kind];
  doc.setDrawColor(g.color[0], g.color[1], g.color[2], g.color[3]);
  doc.setLineWidth(width);
  doc.setLineDashPattern(g.dashed ? [DASH_ON, DASH_OFF] : [], 0);
}

/** 矩形成品：外出血 / 裁切 / 安全边，各平面模板共用 */
export function drawRectGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  strokeGuide(doc, 'bleed');
  doc.rect(x - BLEED, y - BLEED, w + 2 * BLEED, h + 2 * BLEED);

  strokeGuide(doc, 'dieline');
  doc.rect(x, y, w, h);

  if (w > SAFE * 2 && h > SAFE * 2) {
    strokeGuide(doc, 'margin');
    doc.rect(x + SAFE, y + SAFE, w - 2 * SAFE, h - 2 * SAFE);
  }
}

export function drawFoldGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fold: FoldId,
) {
  const lines = foldLines(x, y, w, h, fold);
  if (!lines.length) return;
  strokeGuide(doc, 'dieline');
  lines.forEach((ln) => doc.line(ln.x1, ln.y1, ln.x2, ln.y2));
}

export function clampCornerRadius(w: number, h: number, radius: number) {
  if (!Number.isFinite(radius) || radius <= 0) return 0;
  return Math.min(radius, w / 2, h / 2);
}

/** 圆角成品：外出血 / 裁切 / 安全边 */
export function drawRoundedGuides(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  safe = SAFE,
) {
  const r = clampCornerRadius(w, h, radius);
  const inset = Number.isFinite(safe) && safe > 0 ? safe : SAFE;
  const bleedR = r > 0 ? r + BLEED : 0;

  strokeGuide(doc, 'bleed');
  doc.roundedRect(
    x - BLEED,
    y - BLEED,
    w + 2 * BLEED,
    h + 2 * BLEED,
    bleedR,
    bleedR,
    'S',
  );

  strokeGuide(doc, 'dieline');
  doc.roundedRect(x, y, w, h, r, r, 'S');

  if (w > inset * 2 && h > inset * 2) {
    const ir = Math.max(0, r - inset);
    strokeGuide(doc, 'margin');
    doc.roundedRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset, ir, ir, 'S');
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName || 'template.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

/**
 * 微信内：整页表单 POST 到同源接口，靠 Content-Disposition 触发下载/打开。
 * blob + a.download 在微信里基本无效。
 */
function downloadPdfViaWeChatForm(doc: jsPDF, fileName: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/pdf-download';
  form.enctype = 'multipart/form-data';
  form.style.display = 'none';

  const nameInput = document.createElement('input');
  nameInput.type = 'hidden';
  nameInput.name = 'name';
  nameInput.value = fileName || 'template.pdf';
  form.appendChild(nameInput);

  let attached = false;
  try {
    const blob = doc.output('blob');
    const file = new File([blob], fileName || 'template.pdf', {
      type: 'application/pdf',
    });
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'file';
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    form.appendChild(fileInput);
    attached = fileInput.files.length > 0;
  } catch {
    attached = false;
  }

  if (!attached) {
    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'data';
    const uri = doc.output('datauristring');
    dataInput.value = uri.includes(',') ? uri.split(',')[1]! : uri;
    form.appendChild(dataInput);
  }

  document.body.appendChild(form);
  form.submit();
}

/** 桌面：新标签预览；手机：直接下载；微信：表单 POST */
export function openPdfDoc(doc: jsPDF, fileName = 'template.pdf') {
  if (isWeChatBrowser()) {
    downloadPdfViaWeChatForm(doc, fileName);
    return;
  }
  if (isMobilePdfClient()) {
    doc.save(fileName);
    return;
  }
  const url = String(doc.output('bloburl'));
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** 远程 PDF：桌面预览，手机下载，微信直接跳转下载链接 */
export async function openOrDownloadRemotePdf(
  fileUrl: string,
  fileName: string,
) {
  // 微信必须走真实 HTTP 导航；blob URL / download 属性无效
  if (isWeChatBrowser()) {
    window.location.assign(fileUrl);
    return;
  }

  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`pdf ${res.status}`);
  const blob = await res.blob();
  if (isMobilePdfClient()) {
    triggerBlobDownload(blob, fileName);
    return;
  }
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
}
