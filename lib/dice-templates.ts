import { cache } from 'react';
import { cmsFetch } from '@/lib/cms';

export type DiceKind = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export type DiceTemplateFile = {
  id: DiceKind | 'all';
  label: string;
  fileName: string;
  fileUrl: string;
};

export type CmsFileItem = {
  id: number;
  name: string;
  category_id: number | null;
  url: string;
  size?: number;
  mime?: string;
  created_at?: string;
  category_name?: string | null;
};

const DICE_FILE_CATEGORY_ID = 4;
const DICE_FILE_KEYWORD = 'dice-template';

/** CMS 不可用时的固定回退（与生产 files 一致） */
const DICE_FALLBACK: DiceTemplateFile[] = [
  {
    id: 'd4',
    label: 'D4',
    fileName: 'd4-dice-template.pdf',
    fileUrl: 'https://images.wangsanshui.com/files/1788263651042-vsak6u.pdf',
  },
  {
    id: 'd6',
    label: 'D6',
    fileName: 'd6-dice-template.pdf',
    fileUrl: 'https://images.wangsanshui.com/files/1788263653517-77plwb.pdf',
  },
  {
    id: 'd8',
    label: 'D8',
    fileName: 'd8-dice-template.pdf',
    fileUrl: 'https://images.wangsanshui.com/files/1788263652684-wdlvkc.pdf',
  },
  {
    id: 'd10',
    label: 'D10',
    fileName: 'd10-dice-template.pdf',
    fileUrl: 'https://images.wangsanshui.com/files/1788263653125-fdwizm.pdf',
  },
  {
    id: 'd12',
    label: 'D12',
    fileName: 'd12-dice-template.pdf',
    fileUrl: 'https://images.wangsanshui.com/files/1788263653332-v4gd04.pdf',
  },
  {
    id: 'd20',
    label: 'D20',
    fileName: 'd20-dice-template.pdf',
    fileUrl: 'https://images.wangsanshui.com/files/1788263653731-073s67.pdf',
  },
];

const ALL_FALLBACK: DiceTemplateFile = {
  id: 'all',
  label: 'DOWNLOAD ALL',
  fileName: 'all-dice-templates.pdf',
  fileUrl: 'https://images.wangsanshui.com/files/1788263849728-e1sm77.pdf',
};

const DICE_ORDER: DiceKind[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

function matchDiceKind(name: string): DiceKind | 'all' | null {
  const n = name.trim().toLowerCase();
  if (/^all[-_\s]?dice/.test(n) || n.includes('all-dice-templates')) return 'all';
  for (const kind of DICE_ORDER) {
    if (n.startsWith(`${kind}-`) || n.includes(`${kind}-dice`)) return kind;
  }
  return null;
}

export function mapDiceTemplates(files: CmsFileItem[]): {
  items: DiceTemplateFile[];
  all: DiceTemplateFile | null;
} {
  const byKind = new Map<DiceKind | 'all', CmsFileItem>();
  for (const file of files) {
    const kind = matchDiceKind(file.name || '');
    if (!kind || !file.url?.trim()) continue;
    if (!byKind.has(kind)) byKind.set(kind, file);
  }

  const items = DICE_ORDER.map((kind) => {
    const file = byKind.get(kind);
    const fallback = DICE_FALLBACK.find((item) => item.id === kind)!;
    if (!file) return fallback;
    return {
      id: kind,
      label: kind.toUpperCase(),
      fileName: file.name.trim() || fallback.fileName,
      fileUrl: file.url.trim(),
    };
  });

  const allFile = byKind.get('all');
  const all = allFile
    ? {
        id: 'all' as const,
        label: 'DOWNLOAD ALL',
        fileName: allFile.name.trim() || ALL_FALLBACK.fileName,
        fileUrl: allFile.url.trim(),
      }
    : ALL_FALLBACK;

  return { items, all };
}

export const getDiceTemplates = cache(async () => {
  try {
    const qs = new URLSearchParams({
      category_id: String(DICE_FILE_CATEGORY_ID),
      keyword: DICE_FILE_KEYWORD,
    });
    const files = await cmsFetch<CmsFileItem[]>(
      `/api/web/files?${qs}`,
      ['files', 'dice-templates'],
    );
    return mapDiceTemplates(Array.isArray(files) ? files : []);
  } catch (error) {
    console.error('[getDiceTemplates]', error);
    return { items: DICE_FALLBACK, all: ALL_FALLBACK };
  }
});
