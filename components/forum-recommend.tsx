import Link from 'next/link';
import type { ArticleListItem } from '@/lib/articles';

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function ForumRecommend({ items }: { items: ArticleListItem[] }) {
  return (
    <aside className="community-side blog-recommend forum-recommend">
      <div className="blog-recommend-head">
        <span className="blog-recommend-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 16.5V18.2L7.4 16.5H18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 1 1.75Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="blog-recommend-title">Recommended</h2>
      </div>
      <ul className="blog-recommend-list">
        {items.length === 0 ? (
          <li className="community-empty">No recommendations.</li>
        ) : (
          items.map((item) => {
            const answers = item.comment_count || 0;
            return (
              <li key={item.id} className="blog-recommend-item">
                <Link href={`/forum/${item.id}`} className="blog-recommend-link">
                  {item.title}
                </Link>
                <p className="blog-recommend-meta">
                  <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                  <span aria-hidden="true">•</span>
                  <span>
                    {answers} {answers === 1 ? 'answer' : 'answers'}
                  </span>
                </p>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
