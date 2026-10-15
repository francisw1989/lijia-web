import Image from 'next/image';
import Link from 'next/link';
import { BlogRecommend } from '@/components/blog-recommend';
import { CommunityStats } from '@/components/community-stats';
import { PagePager } from '@/components/page-pager';
import {
  communityListHref,
  type ArticleListItem,
  type CommunityPageData,
} from '@/lib/articles';
import { isCmsAssetUrl } from '@/lib/cms-asset';

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function parseKeywords(keywords: string) {
  return String(keywords || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function BlogCard({ item }: { item: ArticleListItem }) {
  const href = `/blog/${item.id}`;
  const tags = parseKeywords(item.keywords);
  const excerpt = item.description?.trim() || '';

  return (
    <article className="blog-card">
      <Link href={href} className="blog-card-media">
        {item.cover ? (
          <Image
            src={item.cover}
            alt={item.keywords || item.title}
            fill
            unoptimized={isCmsAssetUrl(item.cover)}
            className="object-cover"
            sizes="(max-width: 800px) 100vw, 42vw"
          />
        ) : (
          <span className="blog-card-media-fallback" aria-hidden="true" />
        )}
        <time className="blog-card-date" dateTime={item.created_at}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
            <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 8v4.2l2.4 1.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {formatDate(item.created_at)}
        </time>
      </Link>

      <div className="blog-card-body">
        {tags.length ? (
          <p className="blog-card-keywords" title={tags.join(', ')}>
            {tags.join(' · ')}
          </p>
        ) : null}
        <h2 className="blog-card-title">
          <Link href={href}>{item.title}</Link>
        </h2>
        {excerpt ? <p className="blog-card-excerpt">{excerpt}</p> : null}
        <div className="blog-card-footer">
          <CommunityStats
            views={item.view_count || 0}
            comments={item.comment_count || 0}
            likes={item.like_count || 0}
            commentsHref={`${href}#comments`}
          />
          <Link href={href} className="blog-card-more">
            Read More
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BlogList({
  articles,
  recommended,
  page,
  pageCount,
}: Pick<CommunityPageData, 'articles' | 'recommended' | 'page' | 'pageCount'>) {
  return (
    <main className="community-page">
      <div className="container community-layout">
        <div className="community-main">
          <div className="blog-card-list">
            {articles.length === 0 ? (
              <p className="community-empty">No posts yet.</p>
            ) : (
              articles.map((item) => <BlogCard key={item.id} item={item} />)
            )}
          </div>
          <PagePager
            page={page}
            pageCount={pageCount}
            hrefFor={(n) => communityListHref('/blog', n)}
          />
        </div>
        <BlogRecommend items={recommended} />
      </div>
    </main>
  );
}
