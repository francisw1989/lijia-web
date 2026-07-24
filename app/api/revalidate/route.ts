import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

type RevalidateBody = {
  type?: string;
  id?: number | string;
  action?: string;
};

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get('x-revalidate-secret') ||
    request.nextUrl.searchParams.get('secret');

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  let body: RevalidateBody = {};
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    body = {};
  }

  const type = body.type || 'article';
  const id = body.id != null ? Number(body.id) : undefined;

  // CMS webhook：立即失效，下一次访问拿到最新 HTML
  revalidateTag('articles', { expire: 0 });
  revalidatePath('/articles');
  revalidatePath('/');

  if (type === 'article' && id && Number.isFinite(id)) {
    revalidateTag(`article-${id}`, { expire: 0 });
    revalidatePath(`/articles/${id}`);
  }

  return NextResponse.json({
    revalidated: true,
    type,
    id: id ?? null,
    action: body.action ?? null,
    now: Date.now(),
  });
}
