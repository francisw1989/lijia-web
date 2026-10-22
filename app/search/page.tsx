import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/site-title';
import { groupSearchResults, searchSiteServer } from '@/lib/search';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = String(q || '').trim();
  return pageMetadata({
    title: query ? `Search: ${query}` : 'Search',
    description: 'Search pages, products, blog posts and resources on Lijia.',
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = String(q || '').trim();
  const { results } = await searchSiteServer(query, { limit: 40 });
  const groups = groupSearchResults(results);

  return (
    <main className="bg-white min-h-page search-page">
      <section className="container search-page-inner">
        <h1 className="search-page-title">Search</h1>
        <form className="search-page-form" action="/search" method="get">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search the site…"
            className="search-page-input"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {!query ? (
          <p className="search-page-empty">Enter a keyword to find pages and content.</p>
        ) : results.length === 0 ? (
          <p className="search-page-empty">No results for “{query}”.</p>
        ) : (
          <>
            <p className="search-page-count">
              {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
            </p>
            {groups.map(({ group, items }) => (
              <section key={group} className="search-page-group">
                <h2 className="search-page-group-title">{group}</h2>
                <ul className="search-page-list">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.href}-${item.id ?? item.title}`}>
                      <Link href={item.href} className="search-page-item">
                        <span className="search-page-item-title">{item.title}</span>
                        {item.snippet ? (
                          <span className="search-page-item-snippet">{item.snippet}</span>
                        ) : null}
                        <span className="search-page-item-href">{item.href}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </section>
    </main>
  );
}
