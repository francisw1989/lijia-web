'use client';

import { useEffect, useState } from 'react';
import { AuthModal } from '@/components/auth-modal';
import { CommunityStat } from '@/components/community-stats';
import {
  fetchArticleLiked,
  getCommunityToken,
  subscribeAuth,
  toggleLike,
} from '@/lib/community-auth';

/** Forum/Blog 列表可点赞的统计条，图标与详情页 CommunityStat 一致 */
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
  const [count, setCount] = useState(likes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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
            <CommunityStat kind="views" value={views} />
            <CommunityStat kind="comments" value={comments} href={commentsHref} />
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
