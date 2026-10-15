import Link from 'next/link';
import { ForumCompose } from '@/components/forum-compose';
import { ForumRecommend } from '@/components/forum-recommend';
import { CommunityStatsWithLike } from '@/components/community-stats-like';
import { PagePager } from '@/components/page-pager';
import {
  communityListHref,
  type ArticleListItem,
  type CommunityPageData,
} from '@/lib/articles';

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function parseTags(keywords: string) {
  const tags = String(keywords || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`));
  return tags.length ? tags : ['#Discussion'];
}

function ForumRow({ item }: { item: ArticleListItem }) {
  const href = `/forum/${item.id}`;
  const author = item.author_username || 'Community Member';
  const tags = parseTags(item.keywords);
  const excerpt = item.description?.trim() || '';
  const hasReply = (item.comment_count || 0) > 0;

  return (
    <article className="forum-feed-item">
      <div className="forum-feed-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 16.5V18l2.2-1.5H18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 1 1.7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="forum-feed-body">
        <div className="forum-feed-meta">
          <div className="forum-feed-tags">
            {tags.map((tag) => (
              <span key={tag} className="forum-feed-tag">
                {tag}
              </span>
            ))}
          </div>
          <span className="forum-feed-posted">
            Posted by {author} <span aria-hidden="true">•</span> {formatDate(item.created_at)}
          </span>
        </div>
        <h2 className="forum-feed-title">
          <Link href={href}>{item.title}</Link>
        </h2>
        {excerpt ? <p className="forum-feed-excerpt">{excerpt}</p> : null}
        <div className="forum-feed-footer">
          <CommunityStatsWithLike
            className="forum-feed-stats"
            articleId={item.id}
            views={item.view_count || 0}
            comments={item.comment_count || 0}
            likes={item.like_count || 0}
            commentsHref={`${href}#comments`}
          />
          {hasReply ? (
            <span className="forum-feed-badge is-replied">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                  d="M5 12.5 9.5 17 19 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Community Replied
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ForumList({
  articles,
  recommended,
  page,
  pageCount,
}: Pick<CommunityPageData, 'articles' | 'recommended' | 'page' | 'pageCount'>) {
  return (
    <main className="community-page forum-page">
      <div className="container community-layout forum-layout">
        <div className="community-main forum-main">
          <ForumCompose />
          <section className="forum-feed-card">
            {articles.length === 0 ? (
              <p className="community-empty forum-feed-empty">No topics yet. Ask the first question.</p>
            ) : (
              articles.map((item) => <ForumRow key={item.id} item={item} />)
            )}
          </section>
          <PagePager
            page={page}
            pageCount={pageCount}
            hrefFor={(n) => communityListHref('/forum', n)}
          />
        </div>
        <ForumRecommend items={recommended} />
      </div>
    </main>
  );
}
