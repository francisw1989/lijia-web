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

function estimateReadMinutes(item: ArticleListItem) {
  const chars = (item.description || '').length + (item.title || '').length;
  return Math.max(3, Math.min(12, Math.ceil(chars / 160) || 3));
}

export function BlogRecommend({ items }: { items: ArticleListItem[] }) {
  return (
    <aside className="community-side blog-recommend">
      <div className="blog-recommend-head">
        <span className="blog-recommend-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M8.2 19.5V10.2L13.4 4.5c.5-.5 1.3-.3 1.5.4l.8 3.4h4.1c1.1 0 1.9 1 1.7 2.1l-1.4 6.2c-.2.9-1 1.5-1.9 1.5H8.2Zm-4.4 0V10.2h2.6v9.3H3.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <h2 className="blog-recommend-title">Recommended</h2>
      </div>
      <ul className="blog-recommend-list">
        {items.length === 0 ? (
          <li className="community-empty">No recommendations.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="blog-recommend-item">
              <Link href={`/blog/${item.id}`} className="blog-recommend-link">
                {item.title}
              </Link>
              <p className="blog-recommend-meta">
                <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                <span aria-hidden="true">•</span>
                <span>{estimateReadMinutes(item)} min read</span>
              </p>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
