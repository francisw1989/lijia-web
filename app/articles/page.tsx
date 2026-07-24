import Link from 'next/link';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/cms';

export const metadata: Metadata = {
  title: '文章列表',
};

export default async function ArticlesPage() {
  let list: Awaited<ReturnType<typeof getArticles>>['list'] = [];
  let error: string | null = null;

  try {
    const data = await getArticles(1, 100);
    list = data.list;
  } catch {
    error = '无法连接 CMS，请确认 CMS 已启动。';
  }

  return (
    <main>
      <h1>文章列表</h1>
      <p className="lead">内容来自 CMS `/api/web/articles`，页面为静态 HTML。</p>

      {error ? (
        <p className="empty">{error}</p>
      ) : list.length === 0 ? (
        <p className="empty">暂无已发布文章。</p>
      ) : (
        <ul className="article-list">
          {list.map((item) => (
            <li key={item.id} className="article-card">
              <h2>
                <Link href={`/articles/${item.id}`}>{item.title}</Link>
              </h2>
              <p className="meta">
                {item.category_name || '未分类'} · {item.created_at}
              </p>
              {item.description ? <p>{item.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
