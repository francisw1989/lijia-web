import { NextRequest, NextResponse } from 'next/server';

const CMS_API_URL = (process.env.CMS_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** 转发留言到 CMS，并带上社区登录 Authorization（已登录可跳过邮箱验证码） */
export async function proxyMessagePost(
  request: NextRequest,
  cmsPath: '/api/web/messages/contact' | '/api/web/messages/project' | '/api/web/messages/tools',
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers.Authorization = auth;

  try {
    const res = await fetch(`${CMS_API_URL}${cmsPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach message service' },
      { status: 502 },
    );
  }
}
