import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BlogList } from '@/components/blog-list';
import { getBlogPageData, getCommunityPageParams } from '@/lib/articles';
import { pageMetadata } from '@/lib/site-title';

type Props = {
  params: Promise<{ page: string }>;
};

export async function generateStaticParams() {
  return getCommunityPageParams('Blog');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return pageMetadata({ title: 'Blog' });
  }
  return pageMetadata({
    title: pageNum > 1 ? `Blog · Page ${pageNum}` : 'Blog',
    description: 'News, guides and insights from Lijia Games.',
  });
}

export default async function BlogPagedPage({ params }: Props) {
  const { page: pageParam } = await params;
  const pageNum = Number(pageParam);
  if (!Number.isInteger(pageNum) || pageNum < 1) notFound();
  if (pageNum === 1) redirect('/blog');

  const data = await getBlogPageData(pageNum);
  if (pageNum > data.pageCount) notFound();

  return <BlogList {...data} />;
}
