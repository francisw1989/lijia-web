import { NextRequest, NextResponse } from 'next/server';

const CMS_API_URL = (process.env.CMS_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

async function proxy(request: NextRequest, path: string[]) {
  const targetPath = path.join('/');
  const url = `${CMS_API_URL}/api/web/${targetPath}${request.nextUrl.search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers.Authorization = auth;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || 'Invalid response' };
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach community service' },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
