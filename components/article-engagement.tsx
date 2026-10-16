'use client';

import { useEffect, useState } from 'react';
import { AuthModal } from '@/components/auth-modal';
import {
  COMMUNITY_MUTED_MESSAGE,
  fetchArticleLiked,
  getCommunityToken,
  getCommunityUser,
  isCommunityMuted,
  postComment,
  recordView,
  refreshCommunityMe,
  subscribeAuth,
  toggleLike,
  type CommunityUser,
} from '@/lib/community-auth';
import type { ArticleComment } from '@/lib/articles';
import { CommunityStat } from '@/components/community-stats';
import { clearNativeValidity, englishNativeInvalid } from '@/lib/native-validity';

type Props = {
  articleId: number;
  initialComments: ArticleComment[];
  initialLikeCount: number;
  initialCommentCount: number;
  initialViewCount: number;
  backHref?: string;
  backLabel?: string;
  commentsTitle?: string;
  emptyCommentsText?: string;
  hideStats?: boolean;
  composerPlaceholder?: string;
  submitLabel?: string;
  recommendedLabel?: string;
};

const AVATAR_COLORS = ['#5b8def', '#e08a3c', '#3d7a6a', '#8b6bc9', '#c45c6a', '#4a90a4'];

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function commentTime(value: string) {
  const t = new Date(String(value || '').replace(' ', 'T')).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 推荐优先，同级按时间倒序（最新在前） */
export function sortComments(list: ArticleComment[]) {
  return [...list].sort((a, b) => {
    const ar = a.is_recommended ? 1 : 0;
    const br = b.is_recommended ? 1 : 0;
    if (ar !== br) return br - ar;
    const bt = commentTime(b.created_at) - commentTime(a.created_at);
    if (bt !== 0) return bt;
    return (b.id || 0) - (a.id || 0);
  });
}

function initials(name: string) {
  const parts = String(name || 'U')
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="comment-avatar"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function ArticleEngagement({
  articleId,
  initialComments,
  initialLikeCount,
  initialCommentCount,
  initialViewCount,
  backHref,
  backLabel,
  commentsTitle = 'Comments',
  emptyCommentsText = 'No comments yet. Be the first.',
  hideStats = false,
  composerPlaceholder = 'Write a comment or ask an engineering question...',
  submitLabel = 'Post comment',
  recommendedLabel = 'Recommended',
}: Props) {
  const [user, setUser] = useState<CommunityUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [viewCount] = useState(initialViewCount);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState(() => sortComments(initialComments));
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setUser(getCommunityUser());
    refreshCommunityMe().then(setUser).catch(() => setUser(null));
    return subscribeAuth(() => setUser(getCommunityUser()));
  }, []);

  useEffect(() => {
    setComments(sortComments(initialComments));
    setCommentCount(initialCommentCount);
  }, [initialComments, initialCommentCount]);

  useEffect(() => {
    let cancelled = false;
    const syncLiked = async () => {
      if (!getCommunityToken()) {
        if (!cancelled) setLiked(false);
        return;
      }
      const isLiked = await fetchArticleLiked(articleId);
      if (!cancelled) setLiked(isLiked);
    };
    syncLiked();
    const unsub = subscribeAuth(() => {
      syncLiked();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [articleId]);

  useEffect(() => {
    recordView(articleId).catch(() => {});
  }, [articleId]);

  const requireAuth = () => {
    if (!getCommunityToken()) {
      setAuthOpen(true);
      return false;
    }
    return true;
  };

  const muted = isCommunityMuted(user);
  const canComment = Boolean(user) && !muted && !submitting;

  const onLike = async () => {
    if (!requireAuth()) return;
    if (isCommunityMuted(getCommunityUser())) {
      setMessage(COMMUNITY_MUTED_MESSAGE);
      return;
    }
    setLiking(true);
    setMessage('');
    try {
      const data = await toggleLike(articleId);
      setLiked(data.liked);
      setLikeCount(data.like_count);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Like failed');
    } finally {
      setLiking(false);
    }
  };

  const onComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (isCommunityMuted(getCommunityUser())) {
      setMessage(COMMUNITY_MUTED_MESSAGE);
      return;
    }
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    setMessage('');
    try {
      const data = await postComment(articleId, text);
      setContent('');
      setCommentCount(data.comment_count);
      if (data.pending) {
        setMessage(
          data.message || 'Your content was submitted and will appear after review.',
        );
      } else {
        const comment = data.comment as ArticleComment;
        setComments((prev) => sortComments([comment, ...prev]));
        setMessage('Posted. Page will refresh shortly.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Comment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="article-engagement">
      {hideStats ? null : (
        <div className="article-stats">
          <CommunityStat kind="views" value={viewCount} />
          <CommunityStat kind="comments" value={commentCount} />
          <CommunityStat
            kind="likes"
            value={likeCount}
            active={liked}
            disabled={liking}
            onClick={onLike}
          />
        </div>
      )}

      <section className="article-comments">
        <div className="article-comments-head">
          <h2 className="article-comments-title">{commentsTitle}</h2>
          <span className="article-comments-count">{commentCount}</span>
        </div>

        <form className="article-comment-composer" onSubmit={onComment}>
          {user ? (
            <div className={`article-comment-composer-user${muted ? ' is-muted' : ''}`}>
              <UserAvatar name={user.username} size={40} />
              <div>
                <strong>{user.username}</strong>
                <p>
                  {muted
                    ? 'Your account is muted — commenting is temporarily unavailable.'
                    : 'Commenting as community member'}
                </p>
              </div>
            </div>
          ) : (
            <div className="article-comment-composer-user is-guest">
              <UserAvatar name="Guest" size={40} />
              <div>
                <strong>Guest</strong>
                <p>
                  <button type="button" className="link-btn" onClick={() => setAuthOpen(true)}>
                    Login
                  </button>{' '}
                  to leave a comment
                </p>
              </div>
            </div>
          )}
          {muted ? (
            <p className="article-comment-muted-notice" role="status">
              {COMMUNITY_MUTED_MESSAGE}
            </p>
          ) : null}
          <textarea
            value={content}
            onChange={(e) => {
              clearNativeValidity(e);
              setContent(e.target.value);
            }}
            onInvalid={englishNativeInvalid}
            placeholder={muted ? 'Commenting is unavailable while muted.' : composerPlaceholder}
            rows={4}
            disabled={!canComment}
            required={!muted}
          />
          <div className="article-comment-composer-actions">
            {message && !muted ? (
              <span
                className={`article-comment-msg${
                  /muted|can't post|failed|guidelines|unavailable|violat/i.test(
                    message,
                  )
                    ? ' is-error'
                    : ''
                }`}
              >
                {message}
              </span>
            ) : (
              <span />
            )}
            <button type="submit" className="btn btn-primary" disabled={!canComment}>
              {submitting ? 'Posting…' : submitLabel}
            </button>
          </div>
        </form>

        <ul className="article-comments-list">
          {comments.length === 0 ? (
            <li className="article-comment-empty">{emptyCommentsText}</li>
          ) : (
            comments.map((c) => {
              const name = c.username || 'User';
              const recommended = Boolean(c.is_recommended);
              return (
                <li
                  key={c.id}
                  className={`article-comment${recommended ? ' is-recommended' : ''}`}
                >
                  <div className="article-comment-top">
                    <UserAvatar name={name} />
                    <div className="article-comment-who">
                      <strong>
                        {name}
                        {recommended ? (
                          <span className="article-comment-badge">{recommendedLabel}</span>
                        ) : null}
                      </strong>
                      <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
                    </div>
                  </div>
                  <p className="article-comment-body">{c.content}</p>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {backHref && backLabel ? (
        <a href={backHref} className="about-news-more">
          &lt; {backLabel}
        </a>
      ) : null}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setUser(getCommunityUser())}
      />
    </div>
  );
}
