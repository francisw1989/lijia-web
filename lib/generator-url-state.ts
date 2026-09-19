import type { BoxMaterialMm } from '@/lib/template-generator/box';
import type { MagneticThicknessMm } from '@/lib/template-generator/magnetic-box';
import type { BoardFoldId } from '@/lib/template-generator/board';
import { DEFAULT_NEOPRENE_RADIUS } from '@/lib/template-generator/neoprene-mat';
import type { CardStockId } from '@/lib/template-generator/tuckbox';
import { DEFAULT_CARD_SIZE_ID } from '@/lib/template-generator/cards';

/** URL 查询参数 ↔ 生成器表单（供微信「在浏览器打开」后自动下载） */
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
  /** 系统浏览器打开后自动下载 */
  autoDownload: boolean;
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
  autoDownload: false,
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
    autoDownload: q.get('dl') === '1',
  };
}

export function buildGeneratorSearch(
  state: GeneratorUrlState,
  opts?: { autoDownload?: boolean },
): string {
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
  if (opts?.autoDownload ?? state.autoDownload) q.set('dl', '1');
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function replaceGeneratorUrl(search: string) {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  window.history.replaceState(null, '', `${path}${search}`);
}
