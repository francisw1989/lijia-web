'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchArticleStats,
  subscribeAuth,
  type ArticleStatsItem,
} from '@/lib/community-auth';

type StatsMap = Record<number, ArticleStatsItem>;

const ArticleStatsContext = createContext<{
  enabled: boolean;
  stats: StatsMap;
  patchStat: (id: number, patch: Partial<ArticleStatsItem>) => void;
}>({
  enabled: false,
  stats: {},
  patchStat: () => {},
});

export function ArticleStatsProvider({
  ids,
  children,
}: {
  ids: number[];
  children: ReactNode;
}) {
  const [stats, setStats] = useState<StatsMap>({});
  const idKey = useMemo(
    () =>
      [...new Set(ids.filter((n) => Number.isFinite(n) && n > 0))]
        .sort((a, b) => a - b)
        .join(','),
    [ids],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!idKey) {
        if (!cancelled) setStats({});
        return;
      }
      const map = await fetchArticleStats(idKey.split(',').map(Number));
      if (!cancelled) setStats(map);
    };
    load();
    const unsub = subscribeAuth(() => {
      load();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [idKey]);

  const patchStat = useCallback((id: number, patch: Partial<ArticleStatsItem>) => {
    setStats((prev) => {
      const current = prev[id];
      if (!current) {
        return {
          ...prev,
          [id]: {
            id,
            liked: Boolean(patch.liked),
            like_count: Number(patch.like_count) || 0,
            comment_count: Number(patch.comment_count) || 0,
            view_count: Number(patch.view_count) || 0,
          },
        };
      }
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }, []);

  const value = useMemo(
    () => ({ enabled: true, stats, patchStat }),
    [stats, patchStat],
  );

  return (
    <ArticleStatsContext.Provider value={value}>{children}</ArticleStatsContext.Provider>
  );
}

export function useArticleStatsMap() {
  return useContext(ArticleStatsContext);
}
