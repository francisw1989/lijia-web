import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

type RevalidateBody = {
  type?: string;
  id?: number | string;
  action?: string;
};

const ALL_TAGS = [
  'faqs',
  'products',
  'product-categories',
  'albums',
  'homepage',
] as const;

function revalidateAll() {
  for (const tag of ALL_TAGS) {
    revalidateTag(tag, { expire: 0 });
  }
  // 失效根 layout，覆盖全站页面缓存（增量：下次访问时按需再生）
  revalidatePath('/', 'layout');
}

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

  if (type === 'all' || type === 'publish') {
    revalidateAll();
  } else if (type === 'homepage') {
    revalidateTag('homepage', { expire: 0 });
    revalidatePath('/');
  } else if (type === 'faq') {
    revalidateTag('faqs', { expire: 0 });
    revalidatePath('/tools');
    revalidatePath('/tools/faq');
  } else if (type === 'product' || type === 'product-category') {
    revalidateTag('products', { expire: 0 });
    revalidateTag('product-categories', { expire: 0 });
    revalidatePath('/capabilities/scope');
    revalidatePath('/capabilities/quality');
    revalidatePath('/capabilities');
    revalidatePath('/certificates');
    revalidatePath('/contact');
    revalidatePath('/start-a-project');
    revalidatePath('/tools');
    revalidatePath('/tools/terms');
    revalidatePath('/tools/safety');
    revalidatePath('/tools/dice');
    revalidatePath('/tools/videos');
    revalidatePath('/tools/faq');
    revalidatePath('/manufacturing');
    revalidatePath('/manufacturing/mahjong');
    revalidatePath('/about/news');
    revalidatePath('/about/team');
    revalidatePath('/about/team/list');
    revalidatePath('/');

    if (type === 'product' && id && Number.isFinite(id)) {
      revalidateTag(`product-${id}`, { expire: 0 });
      revalidatePath(`/manufacturing/${id}`);
      revalidatePath(`/about/news/${id}`);
      revalidatePath(`/about/team/${id}`);
    }
    if (type === 'product-category') {
      revalidatePath('/manufacturing/mahjong', 'layout');
      revalidatePath('/contact');
      revalidatePath('/start-a-project');
      revalidatePath('/tools');
      revalidatePath('/tools/terms');
      revalidatePath('/tools/safety');
      revalidatePath('/tools/dice');
      revalidatePath('/about/news');
      revalidatePath('/about/team');
      revalidatePath('/about/team/list');
    }
  } else if (type === 'album') {
    revalidateTag('albums', { expire: 0 });
    revalidateTag('product-categories', { expire: 0 });
    revalidatePath('/about/facilities');
    revalidatePath('/about/team');
    revalidatePath('/about');
    revalidatePath('/capabilities/quality');
    revalidatePath('/capabilities');
  } else {
    revalidatePath('/');
  }

  return NextResponse.json({
    revalidated: true,
    type,
    id: id ?? null,
    action: body.action ?? null,
    now: Date.now(),
  });
}
