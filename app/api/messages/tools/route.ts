import { NextRequest } from 'next/server';
import { proxyMessagePost } from '@/lib/proxy-message';

export async function POST(request: NextRequest) {
  return proxyMessagePost(request, '/api/web/messages/tools');
}
