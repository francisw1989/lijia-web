'use client';

import { useMemo, useState } from 'react';
import { ToolsVideoGrid } from '@/components/tools-video-section';
import type { ToolsVideoItem } from '@/lib/tools-static';

type VideoTag = {
  id: number;
  name: string;
};

export function ToolsVideosContent({
  tags,
  videos,
}: {
  tags: VideoTag[];
  videos: ToolsVideoItem[];
}) {
  const [activeTagId, setActiveTagId] = useState<number | 'all'>('all');

  const visibleTags = useMemo(() => {
    const used = new Set(
      videos.map((item) => item.tagId).filter((id): id is number => id != null),
    );
    return tags.filter((tag) => used.has(tag.id));
  }, [tags, videos]);

  const filteredVideos = useMemo(() => {
    if (activeTagId === 'all') return videos;
    return videos.filter((item) => item.tagId === activeTagId);
  }, [videos, activeTagId]);

  return (
    <>
      {visibleTags.length > 0 ? (
        <div className="tools-videos-tabs-wrap">
          <nav className="page-tabs" aria-label="Video categories">
            <button
              type="button"
              className={`about-tab${activeTagId === 'all' ? ' is-active' : ''}`}
              onClick={() => setActiveTagId('all')}
            >
              All
            </button>
            {visibleTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`about-tab${activeTagId === tag.id ? ' is-active' : ''}`}
                onClick={() => setActiveTagId(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </nav>
        </div>
      ) : null}

      {filteredVideos.length ? (
        <ToolsVideoGrid videos={filteredVideos} />
      ) : (
        <p className="tools-doc-empty">No videos in this category.</p>
      )}
    </>
  );
}
