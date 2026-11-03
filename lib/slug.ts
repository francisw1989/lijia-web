/** 通用 URL slug：标题转路径段；冲突时追加 -{id} */

export function slugifyName(name: string) {
  return (
    String(name || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || ''
  );
}

export function contentSlug(title: string, id?: string | number) {
  const base = slugifyName(title);
  if (base) return base;
  return id != null ? String(id) : '';
}

/** 同集合内 slug 冲突时追加 -{id}，返回 Map<id, slug> */
export function contentSlugMap(items: { id: number; title: string }[]) {
  const bases = items.map((item) => ({
    id: item.id,
    base: contentSlug(item.title, item.id),
  }));
  const counts = new Map<string, number>();
  for (const item of bases) {
    counts.set(item.base, (counts.get(item.base) || 0) + 1);
  }
  const map = new Map<number, string>();
  for (const item of bases) {
    map.set(
      item.id,
      (counts.get(item.base) || 0) > 1 ? `${item.base}-${item.id}` : item.base,
    );
  }
  return map;
}

export function slugFromMap(
  map: Map<number, string>,
  id: number,
  title: string,
) {
  return map.get(id) || contentSlug(title, id);
}

/**
 * 从候选列表解析 URL 段：支持标题 slug，或旧数字 id。
 * 返回匹配项的 id 与规范 slug。
 */
export function resolveContentParam(
  items: { id: number; title: string }[],
  param: string,
): { id: number; slug: string } | null {
  const raw = String(param || '').trim();
  if (!raw) return null;
  const map = contentSlugMap(items);

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    const item = items.find((x) => x.id === id);
    if (!item) return null;
    return { id, slug: slugFromMap(map, id, item.title) };
  }

  for (const [id, slug] of map) {
    if (slug === raw) return { id, slug };
  }
  return null;
}
