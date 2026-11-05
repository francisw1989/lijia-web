import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArticleDetail } from '@/components/article-detail';
import { ArticleEngagement } from '@/components/article-engagement';
import { BlogRecommend } from '@/components/blog-recommend';
import { JsonLd } from '@/components/json-ld';
import {
  getAllArticleIds,
  getArticleByParam,
  getBlogPageData,
} from '@/lib/articles';
import { articleSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/site-title';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getAllArticleIds('Blog');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getArticleByParam('Blog', id);
  if (!data) return pageMetadata({ title: 'Article not found', path: '/blog' });
  return pageMetadata({
    title: data.article.title,
    description: data.article.description || undefined,
    path: `/blog/${data.slug}`,
    image: data.article.cover || undefined,
    type: 'article',
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
  const [data, { recommended }] = await Promise.all([
    getArticleByParam('Blog', id),
    getBlogPageData(),
  ]);
  if (!data) notFound();
  if (id !== data.slug) permanentRedirect(`/blog/${data.slug}`);

  const { article, slug } = data;
  const sideItems = recommended.filter((item) => item.id !== article.id);
  const path = `/blog/${slug}`;

  return (
    <main className="community-page community-detail-page">
      <JsonLd
        data={articleSchema({
          headline: article.title,
          description: article.description,
          image: article.cover,
          url: path,
          datePublished: article.created_at,
          dateModified: article.updated_at || article.created_at,
          authorName: article.author_username,
        })}
      />
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
