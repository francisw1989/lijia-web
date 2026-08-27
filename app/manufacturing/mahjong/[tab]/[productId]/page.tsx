import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArticleDetail } from '@/components/article-detail';
import { MahjongBreadcrumb } from '@/components/mahjong-nav';
import {
  allMahjongProductParams,
  getMahjongPageData,
  getMahjongProductDetail,
  isMeaningfulDescription,
  plainTextFromHtml,
} from '@/lib/mahjong';

type Props = {
  params: Promise<{ tab: string; productId: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return allMahjongProductParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tab, productId } = await params;
  const data = await getMahjongProductDetail(tab, Number(productId));
  if (!data) return { title: 'Mahjong' };

  const description =
    (isMeaningfulDescription(data.product.title, data.product.description)
      ? data.product.description
      : plainTextFromHtml(data.product.content)) || undefined;

  return {
    title: data.product.title,
    description,
    keywords: data.product.keywords || undefined,
  };
}

export default async function MahjongProductPage({ params }: Props) {
  const { tab, productId } = await params;
  if (!/^\d+$/.test(productId)) notFound();

  const [data, page] = await Promise.all([
    getMahjongProductDetail(tab, Number(productId)),
    getMahjongPageData(),
  ]);
  if (!data) notFound();

  const { product, category } = data;

  return (
    <ArticleDetail
      title={product.title}
      kicker={category.name || product.category_name || 'Mahjong'}
      html={product.content}
    >
      <MahjongBreadcrumb tabs={page.tabs} current={product.title} />
    </ArticleDetail>
  );
}
