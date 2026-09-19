import { NextRequest, NextResponse } from 'next/server';
import { contentDisposition } from '@/lib/content-disposition';

export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * 接收客户端生成的 PDF，以 attachment 回写。
 * 用于微信内置浏览器：不支持 blob / a.download，只能靠整页表单导航。
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const name =
      String(form.get('name') || '').trim() || 'template.pdf';
    const file = form.get('file');
    const data = form.get('data');

    let bytes: Uint8Array | null = null;

    if (file instanceof Blob && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ message: 'File too large' }, { status: 413 });
      }
      bytes = new Uint8Array(await file.arrayBuffer());
    } else if (typeof data === 'string' && data.length > 0) {
      const buf = Buffer.from(data, 'base64');
      if (buf.byteLength > MAX_BYTES) {
        return NextResponse.json({ message: 'File too large' }, { status: 413 });
      }
      bytes = buf;
    }

    if (!bytes || bytes.byteLength === 0) {
      return NextResponse.json({ message: 'Missing pdf data' }, { status: 400 });
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition(name),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/pdf-download]', error);
    return NextResponse.json({ message: 'Download failed' }, { status: 502 });
  }
}
