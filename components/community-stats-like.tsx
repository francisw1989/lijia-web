'use client';

import { useEffect, useState } from 'react';
import { AuthModal } from '@/components/auth-modal';
import { useArticleStatsMap } from '@/components/article-stats-provider';
import { CommunityStat } from '@/components/community-stats';
import {
  fetchArticleEngagement,
  getCommunityToken,
  subscribeAuth,
  toggleLike,
} from '@/lib/community-auth';

/** Forum/Blog 列表可点赞的统计条；有 ArticleStatsProvider 时走批量接口 */
export function CommunityStatsWithLike({
  articleId,
  views,
  comments,
  likes,
  className,
  commentsHref,
  likesOnly = false,
}: {
  articleId: number;
  views: number;
  comments: number;
  likes: number;
  className?: string;
  commentsHref?: string;
  likesOnly?: boolean;
}) {
  const { enabled, stats, patchStat } = useArticleStatsMap();
  const live = stats[articleId];

  const [viewCount, setViewCount] = useState(views);
  const [commentCount, setCommentCount] = useState(comments);
  const [count, setCount] = useState(likes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (live) {
      setViewCount(live.view_count);
      setCommentCount(live.comment_count);
      setCount(live.like_count);
      setLiked(getCommunityToken() ? live.liked : false);
      return;
    }
    setViewCount(views);
    setCommentCount(comments);
    setCount(likes);
  }, [live, views, comments, likes]);

  // 无批量 Provider 时才单独拉（详情页等）
  useEffect(() => {
    if (enabled) return;
    let cancelled = false;
    const syncEngagement = async () => {
      const snap = await fetchArticleEngagement(articleId);
      if (cancelled || !snap) return;
      setLiked(getCommunityToken() ? snap.liked : false);
      setCount(snap.like_count);
      setCommentCount(snap.comment_count);
      setViewCount(snap.view_count);
    };
    syncEngagement();
    const unsub = subscribeAuth(() => {
      syncEngagement();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [articleId, enabled]);

  const onLike = async () => {
    if (!getCommunityToken()) {
      setAuthOpen(true);
      return;
    }
    setLoading(true);
    try {
      const data = await toggleLike(articleId);
      setLiked(data.liked);
      setCount(data.like_count);
      patchStat(articleId, { liked: data.liked, like_count: data.like_count });
    } catch {
      // keep previous count
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`community-stats ${className || ''}`.trim()}>
        {likesOnly ? null : (
          <>
            <CommunityStat kind="views" value={viewCount} />
            <CommunityStat kind="comments" value={commentCount} href={commentsHref} />
          </>
        )}
        <CommunityStat
          kind="likes"
          value={count}
          active={liked}
          disabled={loading}
          onClick={onLike}
        />
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          onLike();
        }}
      />
    </>
  );
}
