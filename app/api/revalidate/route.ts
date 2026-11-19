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
  'files',
  'dice-templates',
  'articles',
] as const;

function revalidateArticlePaths(id?: number) {
  revalidateTag('articles', { expire: 0 });
  revalidatePath('/blog');
  revalidatePath('/forum');
  if (id && Number.isFinite(id)) {
    revalidateTag(`article-${id}`, { expire: 0 });
    revalidatePath(`/blog/${id}`);
    revalidatePath(`/forum/${id}`);
  }
}

/** 评论：只刷详情 + 对应列表，避免 product 宽扇出烧 ISR Writes */
function revalidateCommentEngagement(type: string, id?: number) {
  if (type === 'product' || type === 'product-category') {
    if (id && Number.isFinite(id)) {
      revalidateTag(`product-${id}`, { expire: 0 });
      // Events 详情用 getProduct(id)；slug 路由靠 tag，id 路径兼容旧链
      revalidatePath(`/events/${id}`);
    }
    revalidatePath('/events');
    return;
  }

  if (type === 'article' || type === 'blog' || type === 'forum') {
    if (id && Number.isFinite(id)) {
      revalidateTag(`article-${id}`, { expire: 0 });
      revalidatePath(`/blog/${id}`);
      revalidatePath(`/forum/${id}`);
    }
    // 列表用 ['articles', 'blog'|'forum']，按类型窄失效，避免 articles 全局 tag 拖垮所有详情
    if (type === 'blog') {
      revalidateTag('blog', { expire: 0 });
      revalidatePath('/blog');
    } else if (type === 'forum') {
      revalidateTag('forum', { expire: 0 });
      revalidatePath('/forum');
    } else {
      revalidateTag('blog', { expire: 0 });
      revalidateTag('forum', { expire: 0 });
      revalidatePath('/blog');
      revalidatePath('/forum');
    }
  }
}

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
  const action = body.action ?? null;

  // 点赞已由客户端即时更新，与 view 一样不触发 ISR（主降本点）
  if (action === 'like') {
    return NextResponse.json({
      revalidated: true,
      skipped: 'like',
      type,
      id: id ?? null,
      action,
      now: Date.now(),
    });
  }

  // 评论：窄失效，禁止走下方 product 全站 path 列表
  if (action === 'comment') {
    revalidateCommentEngagement(type, id && Number.isFinite(id) ? id : undefined);
    return NextResponse.json({
      revalidated: true,
      narrow: 'comment',
      type,
      id: id ?? null,
      action,
      now: Date.now(),
    });
  }

  if (type === 'all' || type === 'publish') {
    revalidateAll();
  } else if (type === 'homepage') {
    revalidateTag('homepage', { expire: 0 });
    revalidatePath('/');
    revalidatePath('/', 'layout');
  } else if (type === 'faq') {
    revalidateTag('faqs', { expire: 0 });
    revalidatePath('/tools');
    revalidatePath('/tools/faq');
  } else if (type === 'product' || type === 'product-category') {
    revalidateTag('products', { expire: 0 });
    revalidateTag('product-tags', { expire: 0 });
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
    revalidatePath('/tools/ip-protection');
    revalidatePath('/tools/confidentiality-nda');
    revalidatePath('/tools/cookies-privacy');
    revalidatePath('/tools/faq');
    revalidatePath('/manufacturing');
    revalidatePath('/manufacturing/mahjong');
    revalidatePath('/events');
    revalidatePath('/about/facilities');
    revalidatePath('/about/team');
    revalidatePath('/about/team/list');
    revalidatePath('/');

    if (type === 'product' && id && Number.isFinite(id)) {
      revalidateTag(`product-${id}`, { expire: 0 });
      revalidatePath(`/manufacturing/${id}`);
      revalidatePath('/manufacturing', 'layout');
      revalidatePath('/manufacturing/mahjong', 'layout');
      revalidatePath(`/events/${id}`);
      revalidatePath(`/about/facilities/${id}`);
      revalidatePath(`/about/team/${id}`);
      revalidatePath(`/tools/videos/${id}`);
      revalidatePath(`/certificates/${id}`);
    }
    if (type === 'product-category') {
      revalidatePath('/manufacturing', 'layout');
      revalidatePath('/manufacturing/mahjong', 'layout');
      revalidatePath('/contact');
      revalidatePath('/start-a-project');
      revalidatePath('/tools');
      revalidatePath('/tools/terms');
      revalidatePath('/tools/safety');
      revalidatePath('/tools/dice');
      revalidatePath('/events');
      revalidatePath('/about/facilities');
      revalidatePath('/about/team');
      revalidatePath('/about/team/list');
    }
  } else if (type === 'album') {
    revalidateTag('albums', { expire: 0 });
    revalidateTag('product-categories', { expire: 0 });
    revalidatePath('/about/facilities');
    revalidatePath('/about/facilities/gallery', 'layout');
    revalidatePath('/about/team');
    revalidatePath('/about');
    revalidatePath('/capabilities/quality');
    revalidatePath('/capabilities');
  } else if (type === 'file' || type === 'files') {
    revalidateTag('files', { expire: 0 });
    revalidateTag('dice-templates', { expire: 0 });
    revalidatePath('/tools/generator');
  } else if (type === 'article' || type === 'blog' || type === 'forum') {
    revalidateArticlePaths(id && Number.isFinite(id) ? id : undefined);
    if (type === 'blog') {
      revalidatePath('/blog');
      if (id && Number.isFinite(id)) revalidatePath(`/blog/${id}`);
    }
    if (type === 'forum') {
      revalidatePath('/forum');
      if (id && Number.isFinite(id)) revalidatePath(`/forum/${id}`);
    }
  } else {
    revalidatePath('/');
  }

  return NextResponse.json({
    revalidated: true,
    type,
    id: id ?? null,
    action,
    now: Date.now(),
  });
}
