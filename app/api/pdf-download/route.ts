import { NextRequest, NextResponse } from 'next/server';
import { contentDisposition } from '@/lib/content-disposition';
import { putTempPdf, takeTempPdf } from '@/lib/pdf-temp-store';

export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * POST：暂存客户端生成的 PDF，返回短时 GET 地址。
 * GET：按 id 取回（手机浏览器对 blob / a.download 常导航成空白页，需真实 HTTP 下载）。
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const name =
      String(form.get('name') || '').trim() || 'template.pdf';
    const file = form.get('file');
    const data = form.get('data');

    let bytes: Buffer | null = null;

    if (file instanceof Blob && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ message: 'File too large' }, { status: 413 });
      }
      bytes = Buffer.from(await file.arrayBuffer());
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

    const id = putTempPdf(bytes, name);
    return NextResponse.json({
      id,
      url: `/api/pdf-download?id=${id}`,
    });
  } catch (error) {
    console.error('[api/pdf-download POST]', error);
    return NextResponse.json({ message: 'Upload failed' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim() || '';
  const entry = takeTempPdf(id);
  if (!entry) {
    return NextResponse.json(
      { message: 'Link expired or not found. Please generate again.' },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(entry.bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': contentDisposition(entry.name),
      'Cache-Control': 'no-store',
      'Content-Length': String(entry.bytes.byteLength),
    },
  });
}
