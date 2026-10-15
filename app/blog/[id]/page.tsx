import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleDetail } from '@/components/article-detail';
import { ArticleEngagement } from '@/components/article-engagement';
import { BlogRecommend } from '@/components/blog-recommend';
import { getAllArticleIds, getArticle, getBlogPageData } from '@/lib/articles';
import { pageMetadata } from '@/lib/site-title';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getAllArticleIds('Blog');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(Number(id));
  if (!article || article.category_name !== 'Blog') {
    return pageMetadata({ title: 'Article not found' });
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

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const [article, { recommended }] = await Promise.all([
    getArticle(Number(id)),
    getBlogPageData(),
  ]);
  if (!article || article.category_name !== 'Blog') notFound();

  const sideItems = recommended.filter((item) => item.id !== article.id);

  return (
    <main className="community-page community-detail-page">
      <div className="container community-layout">
        <div className="community-main blog-detail-card">
          <ArticleDetail title={article.title} kicker={formatDate(article.created_at)} html={article.content}>
            <Link href="/blog" className="about-news-more">
              &lt; back to Blog
            </Link>
          </ArticleDetail>
          <ArticleEngagement
            articleId={article.id}
            initialComments={article.comments || []}
            initialLikeCount={article.like_count || 0}
            initialCommentCount={article.comment_count || 0}
            initialViewCount={article.view_count || 0}
          />
        </div>
        <BlogRecommend items={sideItems} />
      </div>
    </main>
  );
}
