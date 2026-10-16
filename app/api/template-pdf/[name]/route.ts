import { NextRequest, NextResponse } from 'next/server';
import { contentDisposition } from '@/lib/content-disposition';
import { readTemplatePdf } from '@/lib/template-pdf-cache';

/** 用真实文件名预览暂存的 PDF */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  let filename = name;
  try {
    filename = decodeURIComponent(name);
  } catch {
    filename = name;
  }

  const entry = readTemplatePdf(filename);
  if (!entry) {
    return NextResponse.json({ message: 'Preview expired' }, { status: 404 });
  }

  return new NextResponse(Buffer.from(entry.bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition(filename, 'inline'),
      'Cache-Control': 'no-store',
    },
  });
}
