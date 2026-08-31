import Link from 'next/link';

export function PagePager({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className="page-pager" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="page-pager-btn">
          Prev
        </Link>
      ) : (
        <span className="page-pager-btn is-disabled">Prev</span>
      )}
      {pages.map((n) =>
        n === page ? (
          <span key={n} className="page-pager-btn is-active" aria-current="page">
            {n}
          </span>
        ) : (
          <Link key={n} href={hrefFor(n)} className="page-pager-btn">
            {n}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className="page-pager-btn">
          Next
        </Link>
      ) : (
        <span className="page-pager-btn is-disabled">Next</span>
      )}
    </nav>
  );
}
