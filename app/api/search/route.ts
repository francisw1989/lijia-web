import { NextRequest, NextResponse } from 'next/server';
import { matchStaticPages, searchSiteServer } from '@/lib/search';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const limit = Number(request.nextUrl.searchParams.get('limit')) || 20;

  try {
    const data = await searchSiteServer(q, { limit });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      query: q.trim(),
      results: matchStaticPages(q, limit),
    });
  }
}
