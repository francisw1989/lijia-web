import type { Metadata } from 'next';
import { ForumList } from '@/components/forum-list';
import { getForumPageData } from '@/lib/articles';
import { pageMetadata } from '@/lib/site-title';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Forum',
    description: 'Ask questions and share answers with the Lijia community.',
  });
}

export default async function ForumPage() {
  const data = await getForumPageData(1);
  return <ForumList {...data} />;
}
