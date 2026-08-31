export const FOLD_PRESETS = [
  { id: 'none', label: 'No Fold' },
  { id: 'half-h', label: '1/2 Fold (horizontal)' },
  { id: 'half-v', label: '1/2 Fold (vertical)' },
  { id: 'third-h', label: '1/3 Fold (horizontal)' },
  { id: 'third-v', label: '1/3 Fold (vertical)' },
  { id: 'quarter', label: '1/4 Fold' },
  { id: 'sixth', label: '1/6 Fold' },
] as const;

export type FoldId = (typeof FOLD_PRESETS)[number]['id'];
export type SheetFoldId = Exclude<FoldId, 'sixth'>;

export const SHEET_FOLDS = FOLD_PRESETS.filter(
  (item): item is (typeof FOLD_PRESETS)[number] & { id: SheetFoldId } =>
    item.id !== 'sixth',
);

export function foldedSize(x: number, y: number, fold: FoldId) {
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
      return x >= y ? { w: x / 3, h: y / 2 } : { w: x / 2, h: y / 3 };
    default:
      return { w: x, h: y };
  }
}

/** 折线：在矩形内按模式均分 */
export function foldLines(
  x0: number,
  y0: number,
  bw: number,
  bh: number,
  fold: FoldId,
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
