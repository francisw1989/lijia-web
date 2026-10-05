import Link from 'next/link';

export function ManufacturingBreadcrumb({
  category,
  current,
}: {
  category: { label: string; href: string };
  /** 三级详情页当前文章标题 */
  current?: string;
}) {
  return (
    <nav className="mj-breadcrumb" aria-label="Breadcrumb">
      <ol className="mj-breadcrumb-list">
        <li>
          <Link href="/manufacturing">Manufacturing</Link>
        </li>
        <li>
          {current ? (
            <Link href={category.href}>{category.label}</Link>
          ) : (
            <span aria-current="page">{category.label}</span>
          )}
        </li>
        {current ? (
          <li>
            <span aria-current="page">{current}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
