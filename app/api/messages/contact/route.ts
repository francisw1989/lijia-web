import { NextRequest, NextResponse } from 'next/server';

const CMS_API_URL = (process.env.CMS_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const res = await fetch(`${CMS_API_URL}/api/web/messages/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
