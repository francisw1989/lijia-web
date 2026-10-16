import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleEngagement } from '@/components/article-engagement';
import { CommunityStatsWithLike } from '@/components/community-stats-like';
import { ForumRecommend } from '@/components/forum-recommend';
import { getAllArticleIds, getArticle, getForumPageData } from '@/lib/articles';
import { pageMetadata } from '@/lib/site-title';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getAllArticleIds('Forum');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(Number(id));
  if (!article || article.category_name !== 'Forum') {
    return pageMetadata({ title: 'Topic not found' });
  }
  return pageMetadata({
    title: article.title,
    description: article.description || undefined,
    keywords: article.keywords || undefined,
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${MONTHS[Number(month) - 1]} ${day}, ${year}`;
}

function parseTags(keywords: string) {
  const tags = String(keywords || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
  return tags.length ? tags : ['#Discussion'];
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

export default async function ForumDetailPage({ params }: Props) {
  const { id } = await params;
  const [article, { recommended }] = await Promise.all([
    getArticle(Number(id)),
    getForumPageData(),
  ]);
  if (!article || article.category_name !== 'Forum') notFound();

  const author = article.author_username || 'Community Member';
  const tags = parseTags(article.keywords);
  const description = article.description?.trim() || '';
  const answerCount = article.comment_count || 0;
  const sideItems = recommended.filter((item) => item.id !== article.id);

  return (
    <main className="community-page forum-detail-page">
      <div className="container community-layout forum-layout">
        <div className="community-main forum-main">
          <section className="forum-question-card">
            <Link href="/forum" className="about-news-more forum-detail-back">
              &lt; back to Forum
            </Link>
            <div className="forum-question-top">
              <div className="forum-question-tags">
                {tags.map((tag) => (
                  <span key={tag} className="forum-question-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <h1 className="forum-question-title">{article.title}</h1>

            <div className="forum-question-byline">
              <div className="forum-question-author">
                <span className="forum-question-avatar" aria-hidden="true">
                  {initials(author)}
                </span>
                <span className="forum-question-asked">
                  <strong>{author}</strong> asked {formatDate(article.created_at)}
                </span>
              </div>
              <div className="forum-question-meta-stats" aria-label="Post stats">
                <span title={`${article.view_count || 0} views`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                    <path
                      d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  {(article.view_count || 0).toLocaleString('en-US')} views
                </span>
                <span title={`${answerCount} answers`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                    <path
                      d="M5 16.5V18l2.2-1.5H18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 1 1.7Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
                </span>
              </div>
            </div>

            {description ? <p className="forum-question-desc">{description}</p> : null}

            <div className="forum-question-actions" id="comments">
              <a href="#comments" className="forum-question-answer-btn">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                  <path
                    d="M4 17.5 5.2 12 16.8 4.8a1.2 1.2 0 0 1 1.7 1.5L12.2 18.2 4 17.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.5 8.5 15.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                Answer
              </a>
              <CommunityStatsWithLike
                articleId={article.id}
                views={article.view_count || 0}
                comments={article.comment_count || 0}
                likes={article.like_count || 0}
                likesOnly
              />
            </div>
          </section>

          <div className="forum-detail-engagement">
            <ArticleEngagement
              articleId={article.id}
              initialComments={article.comments || []}
              initialLikeCount={article.like_count || 0}
              initialCommentCount={article.comment_count || 0}
              initialViewCount={article.view_count || 0}
              commentsTitle="Answers"
              emptyCommentsText="No answers yet. Be the first."
              composerPlaceholder="Share your answer or production tips..."
              submitLabel="Post answer"
              recommendedLabel="Recommended"
              hideStats
            />
          </div>
        </div>
        <ForumRecommend items={sideItems} />
      </div>
    </main>
  );
}
