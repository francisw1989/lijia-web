import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-white min-h-page not-found-page">
      <div className="container not-found-inner">
        <p className="not-found-code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found-title">This page could not be found.</h1>
        <p className="not-found-desc">
          The page you are looking for may have been moved or no longer exists.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
