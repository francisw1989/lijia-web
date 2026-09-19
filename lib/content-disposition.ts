/** 构造 Content-Disposition，兼容 ASCII / UTF-8 文件名 */
export function contentDisposition(filename: string) {
  const safe = filename.replace(/[\r\n"/\\]/g, '_').trim() || 'download';
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_') || 'download';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}
