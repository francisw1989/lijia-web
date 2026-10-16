import { NextRequest, NextResponse } from 'next/server';
import { saveTemplatePdf } from '@/lib/template-pdf-cache';

const MAX_BYTES = 20 * 1024 * 1024;

/** 暂存客户端生成的 PDF，返回可预览的文件名地址 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: 'Invalid form' }, { status: 400 });
  }

  const file = form.get('file');
  const rawName = String(form.get('name') || (file instanceof File ? file.name : '') || 'template.pdf');
  let filename = rawName.trim() || 'template.pdf';
  if (!filename.toLowerCase().endsWith('.pdf')) filename = `${filename}.pdf`;
  filename = filename.replace(/[\\/]/g, '_');

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Missing file' }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ message: 'Invalid file size' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder().decode(bytes.slice(0, 5));
  if (!header.startsWith('%PDF')) {
    return NextResponse.json({ message: 'Not a PDF' }, { status: 400 });
  }

  saveTemplatePdf(filename, bytes);
  return NextResponse.json({
    url: `/api/template-pdf/${encodeURIComponent(filename)}`,
  });
}
