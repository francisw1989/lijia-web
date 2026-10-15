import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ForumList } from '@/components/forum-list';
import { getCommunityPageParams, getForumPageData } from '@/lib/articles';
import { pageMetadata } from '@/lib/site-title';

type Props = {
  params: Promise<{ page: string }>;
};

export async function generateStaticParams() {
  return getCommunityPageParams('Forum');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return pageMetadata({ title: 'Forum' });
  }
  return pageMetadata({
    title: pageNum > 1 ? `Forum · Page ${pageNum}` : 'Forum',
    description: 'Ask questions and share answers with the Lijia community.',
  });
}

export default async function ForumPagedPage({ params }: Props) {
  const { page: pageParam } = await params;
  const pageNum = Number(pageParam);
  if (!Number.isInteger(pageNum) || pageNum < 1) notFound();
  if (pageNum === 1) redirect('/forum');

  const data = await getForumPageData(pageNum);
  if (pageNum > data.pageCount) notFound();

  return <ForumList {...data} />;
}
