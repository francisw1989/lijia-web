'use client';

export type CommunityUser = {
  id: number;
  email: string;
  username: string;
  status: number;
  created_at?: string;
};

/** 前台统一的禁言提示（英文站） */
export const COMMUNITY_MUTED_MESSAGE =
  "Your account has been muted, so you can't post right now. Please contact us if you think this is a mistake.";

export function isCommunityMuted(user: CommunityUser | null | undefined) {
  return Boolean(user && user.status !== 1);
}

function isMuteApiError(status: number, data: { code?: string; message?: string }) {
  if (status !== 403) return false;
  if (data.code === 'MUTED') return true;
  return /禁言|muted|mute/i.test(String(data.message || ''));
}

export function communityActionError(
  status: number,
  data: { code?: string; message?: string } | string | undefined,
  fallback: string,
) {
  const payload = typeof data === 'string' ? { message: data } : data || {};
  if (isMuteApiError(status, payload)) {
    return COMMUNITY_MUTED_MESSAGE;
  }
  return payload.message || fallback;
}

const TOKEN_KEY = 'lijia_community_token';
const USER_KEY = 'lijia_community_user';

type AuthListener = () => void;
const listeners = new Set<AuthListener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeAuth(listener: AuthListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCommunityToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCommunityUser(): CommunityUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CommunityUser) : null;
  } catch {
    return null;
  }
}

export function setCommunitySession(token: string, user: CommunityUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notify();
}

export function clearCommunitySession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notify();
}

async function communityFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T & { message?: string } }> {
  const token = getCommunityToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api/community/${path.replace(/^\//, '')}`, {
    ...options,
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  return { ok: res.ok, status: res.status, data };
}

export async function sendRegisterCode(email: string) {
  const { ok, data } = await communityFetch<{
    message?: string;
    cooldown?: number;
  }>('auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!ok) {
    const err = new Error(data.message || 'Failed to send verification code') as Error & {
      cooldown?: number;
    };
    if (typeof data.cooldown === 'number') err.cooldown = data.cooldown;
    throw err;
  }
  return data;
}

export async function registerCommunity(input: {
  email: string;
  username: string;
  password: string;
  code: string;
}) {
  const { ok, data } = await communityFetch<{
    token: string;
    user: CommunityUser;
    message?: string;
  }>('auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!ok) throw new Error(data.message || 'Registration failed');
  setCommunitySession(data.token, data.user);
  return data.user;
}

export async function loginCommunity(input: {
  account: string;
  password: string;
}) {
  const { ok, data } = await communityFetch<{
    token: string;
    user: CommunityUser;
    message?: string;
  }>('auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!ok) throw new Error(data.message || 'Login failed');
  setCommunitySession(data.token, data.user);
  return data.user;
}

export async function refreshCommunityMe() {
  const token = getCommunityToken();
  if (!token) return null;
  const { ok, data } = await communityFetch<{ user: CommunityUser; message?: string }>(
    'auth/me',
  );
  if (!ok) {
    clearCommunitySession();
    return null;
  }
  setCommunitySession(token, data.user);
  return data.user;
}

export async function postComment(articleId: number, content: string) {
  const { ok, status, data } = await communityFetch<{
    comment: unknown;
    comment_count: number;
    pending?: boolean;
    message?: string;
  }>('comments', {
    method: 'POST',
    body: JSON.stringify({ article_id: articleId, content }),
  });
  if (!ok) throw new Error(communityActionError(status, data, 'Comment failed'));
  return data;
}

export async function toggleLike(articleId: number) {
  const { ok, status, data } = await communityFetch<{
    liked: boolean;
    like_count: number;
    message?: string;
    code?: string;
  }>(`articles/${articleId}/like`, { method: 'POST' });
  if (!ok) throw new Error(communityActionError(status, data, 'Like failed'));
  return data;
}

export type EngagementSnapshot = {
  liked: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  comments: Array<{
    id: number;
    content: string;
    created_at: string;
    username?: string | null;
    is_recommended?: number;
  }>;
};

export type ArticleStatsItem = {
  id: number;
  liked: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
};

/** 列表批量拉互动计数（一次请求） */
export async function fetchArticleStats(
  ids: number[],
): Promise<Record<number, ArticleStatsItem>> {
  const unique = [...new Set(ids.filter((n) => Number.isFinite(n) && n > 0))];
  if (!unique.length) return {};
  const { ok, data } = await communityFetch<{
    list?: Array<{
      id: number;
      liked?: boolean;
      like_count?: number;
      comment_count?: number;
      view_count?: number;
    }>;
  }>(`article-stats?ids=${unique.join(',')}`);
  if (!ok || !Array.isArray(data.list)) return {};
  const map: Record<number, ArticleStatsItem> = {};
  for (const row of data.list) {
    map[row.id] = {
      id: row.id,
      liked: Boolean(row.liked),
      like_count: Number(row.like_count) || 0,
      comment_count: Number(row.comment_count) || 0,
      view_count: Number(row.view_count) || 0,
    };
  }
  return map;
}

/** 实时拉取文章互动数据（不依赖 ISR） */
export async function fetchArticleEngagement(
  articleId: number,
): Promise<EngagementSnapshot | null> {
  if (!articleId) return null;
  const { ok, data } = await communityFetch<{
    liked?: boolean;
    like_count?: number;
    comment_count?: number;
    view_count?: number;
    comments?: EngagementSnapshot['comments'];
  }>(`articles/${articleId}`);
  if (!ok) return null;
  return {
    liked: Boolean(data.liked),
    like_count: Number(data.like_count) || 0,
    comment_count: Number(data.comment_count) || 0,
    view_count: Number(data.view_count) || 0,
    comments: Array.isArray(data.comments) ? data.comments : [],
  };
}

/** 查询当前登录用户是否已点赞某篇文章（走详情接口的 liked 字段） */
export async function fetchArticleLiked(articleId: number) {
  if (!getCommunityToken() || !articleId) return false;
  const snap = await fetchArticleEngagement(articleId);
  return Boolean(snap?.liked);
}

export async function recordView(articleId: number) {
  const { ok, data } = await communityFetch<{ view_count?: number }>(
    `articles/${articleId}/view`,
    { method: 'POST' },
  );
  if (!ok) return null;
  return { view_count: Number(data.view_count) || 0 };
}

export async function postProductComment(productId: number, content: string) {
  const { ok, status, data } = await communityFetch<{
    comment: unknown;
    comment_count: number;
    pending?: boolean;
    message?: string;
  }>('product-comments', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, content }),
  });
  if (!ok) throw new Error(communityActionError(status, data, 'Comment failed'));
  return data;
}

export async function toggleProductLike(productId: number) {
  const { ok, status, data } = await communityFetch<{
    liked: boolean;
    like_count: number;
    message?: string;
    code?: string;
  }>(`products/${productId}/like`, { method: 'POST' });
  if (!ok) throw new Error(communityActionError(status, data, 'Like failed'));
  return data;
}

/** 实时拉取产品（Events 等）互动数据 */
export async function fetchProductEngagement(
  productId: number,
): Promise<EngagementSnapshot | null> {
  if (!productId) return null;
  const { ok, data } = await communityFetch<{
    liked?: boolean;
    like_count?: number;
    comment_count?: number;
    view_count?: number;
    comments?: EngagementSnapshot['comments'];
  }>(`products/${productId}`);
  if (!ok) return null;
  return {
    liked: Boolean(data.liked),
    like_count: Number(data.like_count) || 0,
    comment_count: Number(data.comment_count) || 0,
    view_count: Number(data.view_count) || 0,
    comments: Array.isArray(data.comments) ? data.comments : [],
  };
}

export async function fetchProductLiked(productId: number) {
  if (!getCommunityToken() || !productId) return false;
  const snap = await fetchProductEngagement(productId);
  return Boolean(snap?.liked);
}

export async function recordProductView(productId: number) {
  const { ok, data } = await communityFetch<{ view_count?: number }>(
    `products/${productId}/view`,
    { method: 'POST' },
  );
  if (!ok) return null;
  return { view_count: Number(data.view_count) || 0 };
}

export async function createForumPost(input: {
  title: string;
  content: string;
  cover?: string;
}) {
  const { ok, status, data } = await communityFetch<{
    id: number;
    title: string;
    pending?: boolean;
    message?: string;
  }>('forum/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!ok) throw new Error(communityActionError(status, data, 'Failed to post'));
  return data;
}
