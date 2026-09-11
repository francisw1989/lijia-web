import { hasRichContent } from '@/lib/capabilities';

/** 全站文章/产品详情：标题 + 栏目/日期 + 可选媒体 + 正文。 */
export function ArticleDetail({
  title,
  kicker,
  html,
  media,
  children,
}: {
  title: string;
  kicker?: string;
  html?: string;
  media?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const body = html?.trim() || '';

  return (
    <section className="article-detail cap-tag-page">
      {children}
      <h1 className="cap-tag-page-title">{title}</h1>
      {kicker ? <p className="cap-tag-page-category">{kicker}</p> : null}
      {media}
      {hasRichContent(body) ? (
        <div
          className="cap-tag-page-body"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : null}
    </section>
  );
}
