import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticle, getArticles } from '@/lib/cms';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  try {
    const data = await getArticles(1, 100);
    return data.list.map((item) => ({ id: String(item.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(Number(id));
  if (!article) return { title: '文章不存在' };
  return {
    title: article.title,
    description: article.description || undefined,
    keywords: article.keywords || undefined,
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(Number(id));
  if (!article) notFound();

  return (
    <main>
      <Link href="/articles" className="back">
        ← 返回列表
      </Link>
      <h1>{article.title}</h1>
      <p className="meta">
        {article.category_name || '未分类'} · {article.created_at}
      </p>
      <article
        className="article-body"
        dangerouslySetInnerHTML={{ __html: article.content || '<p>暂无正文</p>' }}
      />
    </main>
  );
}
