import type { BoxMaterialMm } from '@/lib/template-generator/box';
import type { MagneticThicknessMm } from '@/lib/template-generator/magnetic-box';
import type { BoardFoldId } from '@/lib/template-generator/board';
import { DEFAULT_NEOPRENE_RADIUS } from '@/lib/template-generator/neoprene-mat';
import type { CardStockId } from '@/lib/template-generator/tuckbox';
import { DEFAULT_CARD_SIZE_ID } from '@/lib/template-generator/cards';
import { openInSystemBrowser } from '@/lib/pdf-client';

/** URL 查询参数 ↔ 生成器表单（微信跳转时带上参数回填） */
export type GeneratorUrlState = {
  template: string;
  x: string;
  y: string;
  z: string;
  material: BoxMaterialMm | '';
  magThickness: MagneticThicknessMm | '';
  fold: BoardFoldId;
  doubleSided: boolean;
  cardMode: 'standard' | 'custom';
  cardSizeId: string;
  radius: string;
  neoRadius: number;
  stitched: boolean;
  outside: string;
  spine: string;
  depthMode: 'custom' | 'cards';
  cardQty: string;
  cardStock: CardStockId | 'custom' | '';
  customCardMm: string;
  /** dice 文件 id，或 all */
  dice: string;
};

export const DEFAULT_GENERATOR_URL_STATE: GeneratorUrlState = {
  template: 'two-piece-box',
  x: '',
  y: '',
  z: '',
  material: '',
  magThickness: '',
  fold: 'half-h',
  doubleSided: false,
  cardMode: 'standard',
  cardSizeId: DEFAULT_CARD_SIZE_ID,
  radius: '',
  neoRadius: DEFAULT_NEOPRENE_RADIUS,
  stitched: false,
  outside: '0',
  spine: '0',
  depthMode: 'custom',
  cardQty: '',
  cardStock: '',
  customCardMm: '',
  dice: '',
};

export function parseGeneratorSearch(search: string): GeneratorUrlState {
  const q = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const foldRaw = q.get('fold') || 'half-h';
  const fold = (
    ['half-h', 'half-v', 'quarter', 'sixth'] as BoardFoldId[]
  ).includes(foldRaw as BoardFoldId)
    ? (foldRaw as BoardFoldId)
    : 'half-h';

  const cardMode = q.get('cm') === 'custom' ? 'custom' : 'standard';
  const depthMode = q.get('dm') === 'cards' ? 'cards' : 'custom';
  const neo = Number(q.get('nr'));
  const cardStockRaw = q.get('cstock') || '';

  return {
    template: q.get('t') || DEFAULT_GENERATOR_URL_STATE.template,
    x: q.get('x') || '',
    y: q.get('y') || '',
    z: q.get('z') || '',
    material: (q.get('m') || '') as BoxMaterialMm | '',
    magThickness: (q.get('mt') || '') as MagneticThicknessMm | '',
    fold,
    doubleSided: q.get('ds') === '1',
    cardMode,
    cardSizeId: q.get('cs') || DEFAULT_CARD_SIZE_ID,
    radius: q.get('r') || '',
    neoRadius: Number.isFinite(neo) && neo > 0 ? neo : DEFAULT_NEOPRENE_RADIUS,
    stitched: q.get('st') === '1',
    outside: q.get('out') ?? '0',
    spine: q.get('sp') ?? '0',
    depthMode,
    cardQty: q.get('cq') || '',
    cardStock: cardStockRaw as CardStockId | 'custom' | '',
    customCardMm: q.get('cmm') || '',
    dice: q.get('dice') || '',
  };
}

export function buildGeneratorSearch(state: GeneratorUrlState): string {
  const q = new URLSearchParams();
  q.set('t', state.template);
  if (state.x) q.set('x', state.x);
  if (state.y) q.set('y', state.y);
  if (state.z) q.set('z', state.z);
  if (state.material) q.set('m', String(state.material));
  if (state.magThickness) q.set('mt', String(state.magThickness));
  if (state.fold && state.fold !== 'half-h') q.set('fold', state.fold);
  if (state.doubleSided) q.set('ds', '1');
  if (state.cardMode === 'custom') q.set('cm', 'custom');
  if (state.cardSizeId && state.cardSizeId !== DEFAULT_CARD_SIZE_ID) {
    q.set('cs', state.cardSizeId);
  }
  if (state.radius) q.set('r', state.radius);
  if (state.neoRadius !== DEFAULT_NEOPRENE_RADIUS) {
    q.set('nr', String(state.neoRadius));
  }
  if (state.stitched) q.set('st', '1');
  if (state.outside && state.outside !== '0') q.set('out', state.outside);
  if (state.spine && state.spine !== '0') q.set('sp', state.spine);
  if (state.depthMode === 'cards') q.set('dm', 'cards');
  if (state.cardQty) q.set('cq', state.cardQty);
  if (state.cardStock) q.set('cstock', state.cardStock);
  if (state.customCardMm) q.set('cmm', state.customCardMm);
  if (state.dice) q.set('dice', state.dice);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * 微信内：打开「当前页 + 参数」的真实 https 链接（唤起系统浏览器）。
 * 禁止走 blob / doc.save，否则系统浏览器地址栏会变成空白 blob: 页。
 * @returns need-manual 时（多为 iOS）需提示用户手动「在浏览器打开」
 */
export function openGeneratorParamWindow(
  state: GeneratorUrlState,
  opts?: { diceId?: string },
): 'launched' | 'need-manual' {
  if (typeof window === 'undefined') return 'need-manual';
  const search = buildGeneratorSearch({
    ...state,
    dice: opts?.diceId || state.dice,
  });
  const url = `${window.location.origin}${window.location.pathname}${search}`;
  return openInSystemBrowser(url);
}
