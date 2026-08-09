import { NextRequest, NextResponse } from 'next/server';
import { isCmsAssetUrl } from '@/lib/cms-asset';

function sanitizeFileName(name: string) {
  const safe = name.replace(/[\r\n"/\\]/g, '_').trim() || 'download';
  return safe;
}

function contentDisposition(filename: string) {
  const safe = sanitizeFileName(filename);
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_') || 'download';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

/** 同源代理下载：用真实文件名触发浏览器另存为 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')?.trim() || '';
  const name =
    request.nextUrl.searchParams.get('name')?.trim() ||
    url.split('/').pop() ||
    'download';

  if (!url) {
    return NextResponse.json({ message: 'Missing url' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ message: 'Invalid url' }, { status: 400 });
  }

  if (!isCmsAssetUrl(url) && parsed.protocol !== 'https:') {
    return NextResponse.json({ message: 'Forbidden url' }, { status: 403 });
  }
  if (!isCmsAssetUrl(url)) {
    return NextResponse.json({ message: 'Forbidden url' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: 'force-cache' });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { message: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const headers = new Headers();
    headers.set(
      'Content-Type',
      upstream.headers.get('Content-Type') || 'application/octet-stream',
    );
    headers.set('Content-Disposition', contentDisposition(name));
    const len = upstream.headers.get('Content-Length');
    if (len) headers.set('Content-Length', len);
    headers.set('Cache-Control', 'private, max-age=3600');

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('[api/download]', error);
    return NextResponse.json({ message: 'Download failed' }, { status: 502 });
  }
}
