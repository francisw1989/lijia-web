import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RevealInit } from '@/components/reveal-init';
import { FaqList } from '@/components/faq-list';
import { getFaqs } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about LIJIA game manufacturing, sampling, MOQ and compliance.',
};

const INTRO =
  'Find quick answers about sampling, MOQ, artwork, packaging and compliance. If you need a detailed quote, start a project and our team will follow up.';

export default async function ToolsFaqPage() {
  let items: Awaited<ReturnType<typeof getFaqs>> = [];
  try {
    items = await getFaqs();
  } catch (error) {
    console.error('[ToolsFaqPage]', error);
  }

  return (
    <main className="bg-white min-h-page">
      <RevealInit />

      <section className="container tools-doc-page">
        <div className="tools-doc-back">
          <Link href="/tools" className="about-news-more">
            &lt; Back to Tools &amp; Resources
          </Link>
        </div>

        <div className="tools-doc-header">
          <span className="tools-doc-icon">
            <Image src="/images/t/3.png" alt="" width={88} height={88} />
          </span>
          <div>
            <h1 className="tools-doc-heading">FAQ</h1>
            <p className="tools-doc-intro">{INTRO}</p>
          </div>
        </div>

        {items.length ? (
          <FaqList items={items} />
        ) : (
          <p className="tools-doc-empty">FAQ will be available soon.</p>
        )}
      </section>
    </main>
  );
}
