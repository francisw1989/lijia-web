import Link from 'next/link';
import { getArticles } from '@/lib/cms';

export default async function HomePage() {
  let latest: Awaited<ReturnType<typeof getArticles>>['list'] = [];
  let error: string | null = null;

  try {
    const data = await getArticles(1, 5);
    latest = data.list;
  } catch {
    error = '无法连接 CMS，请确认 CMS 已启动且 CMS_API_URL 正确。';
  }

  return (
    <main>
      <h1>Lijia Web 示例</h1>
      <p className="lead">
        Next.js SSG + CMS 手动「同步前台」触发增量静态更新。
      </p>

      {error ? (
        <p className="empty">{error}</p>
      ) : latest.length === 0 ? (
        <p className="empty">暂无已发布文章。请在 CMS 发布后点击「同步前台」。</p>
      ) : (
        <ul className="article-list">
          {latest.map((item) => (
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

      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/articles">查看全部文章 →</Link>
      </p>
    </main>
  );
}
