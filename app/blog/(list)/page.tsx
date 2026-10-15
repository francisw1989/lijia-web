import type { Metadata } from 'next';
import { BlogList } from '@/components/blog-list';
import { getBlogPageData } from '@/lib/articles';
import { pageMetadata } from '@/lib/site-title';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Blog',
    description: 'News, guides and insights from Lijia Games.',
  });
}

export default async function BlogPage() {
  const data = await getBlogPageData(1);
  return <BlogList {...data} />;
}
