import { randomBytes } from 'crypto';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

type Entry = {
  name: string;
  expires: number;
};

const TTL_MS = 5 * 60 * 1000;
const memory = new Map<string, { bytes: Buffer; meta: Entry }>();
const dir = join(tmpdir(), 'lijia-pdf-temp');

try {
  mkdirSync(dir, { recursive: true });
} catch {
  // ignore
}

function prune() {
  const now = Date.now();
  for (const [id, item] of memory) {
    if (item.meta.expires < now) {
      memory.delete(id);
      try {
        unlinkSync(join(dir, id));
        unlinkSync(join(dir, `${id}.json`));
      } catch {
        // ignore
      }
    }
  }
}

/** 暂存 PDF，返回短时 id（约 5 分钟） */
export function putTempPdf(bytes: Buffer, name: string): string {
  prune();
  const id = randomBytes(16).toString('hex');
  const meta: Entry = { name, expires: Date.now() + TTL_MS };
  memory.set(id, { bytes, meta });
  try {
    writeFileSync(join(dir, id), bytes);
    writeFileSync(join(dir, `${id}.json`), JSON.stringify(meta), 'utf8');
  } catch {
    // 仅内存也可
  }
  return id;
}

/** 取出并删除 */
export function takeTempPdf(id: string): { bytes: Buffer; name: string } | null {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;

  const mem = memory.get(id);
  if (mem) {
    memory.delete(id);
    try {
      unlinkSync(join(dir, id));
      unlinkSync(join(dir, `${id}.json`));
    } catch {
      // ignore
    }
    if (mem.meta.expires < Date.now()) return null;
    return { bytes: mem.bytes, name: mem.meta.name };
  }

  const filePath = join(dir, id);
  const metaPath = join(dir, `${id}.json`);
  if (!existsSync(filePath) || !existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as Entry;
    const bytes = readFileSync(filePath);
    unlinkSync(filePath);
    unlinkSync(metaPath);
    if (meta.expires < Date.now()) return null;
    return { bytes, name: meta.name };
  } catch {
    return null;
  }
}
