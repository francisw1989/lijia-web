import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RevealInit } from '@/components/reveal-init';
import { ToolsDocDownload } from '@/components/tools-doc-download';
import {
  getToolsDocPageData,
  isToolsResourceSlug,
  type ToolsDocItem,
} from '@/lib/tools';

// 文档列表需及时拿到 cover_file_name，避免静态缓存里仍是哈希名
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [{ slug: 'terms' }, { slug: 'safety' }, { slug: 'dice' }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isToolsResourceSlug(slug)) return { title: 'Tools & Resources' };
  const data = await getToolsDocPageData(slug);
  if (!data) return { title: 'Tools & Resources' };
  return {
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
  };
}

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function DocRow({ item }: { item: ToolsDocItem }) {
  return (
    <article className="tools-doc-row">
      <div className="tools-doc-row-body">
        <h2 className="tools-doc-title">{item.title}</h2>
        {item.description ? (
          <p className="tools-doc-desc">{item.description}</p>
        ) : null}
        <div className="tools-doc-meta">
          <span>{item.fileName}</span>
          {item.updatedAt ? (
            <time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time>
          ) : null}
        </div>
      </div>
      <ToolsDocDownload fileUrl={item.fileUrl} fileName={item.fileName} />
    </article>
  );
}

export default async function ToolsDocListPage({ params }: PageProps) {
  const { slug } = await params;
  // Turbopack 下 notFound() 会触发 require is not defined，改用 redirect
  if (!isToolsResourceSlug(slug)) redirect('/tools');

  const data = await getToolsDocPageData(slug);
  if (!data) redirect('/tools');

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
            <Image src={data.icon} alt="" width={88} height={88} />
          </span>
          <div>
            <h1 className="tools-doc-heading">{data.meta.title}</h1>
            {data.subtitle ? (
              <p className="tools-doc-intro">{data.subtitle}</p>
            ) : null}
          </div>
        </div>

        {data.documents.length ? (
          <div className="tools-doc-list">
            {data.documents.map((item) => (
              <DocRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="tools-doc-empty">Documents will be available soon.</p>
        )}
      </section>
    </main>
  );
}
