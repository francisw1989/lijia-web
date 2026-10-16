type CachedPdf = {
  bytes: Uint8Array;
  expires: number;
};

const globalStore = globalThis as typeof globalThis & {
  __lijiaTemplatePdf?: Map<string, CachedPdf>;
};

function store() {
  if (!globalStore.__lijiaTemplatePdf) {
    globalStore.__lijiaTemplatePdf = new Map();
  }
  return globalStore.__lijiaTemplatePdf;
}

export function saveTemplatePdf(filename: string, bytes: Uint8Array) {
  const now = Date.now();
  const cache = store();
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key);
  }
  cache.set(filename, {
    bytes,
    expires: now + 5 * 60 * 1000,
  });
}

export function readTemplatePdf(filename: string) {
  const entry = store().get(filename);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    store().delete(filename);
    return null;
  }
  return entry;
}
