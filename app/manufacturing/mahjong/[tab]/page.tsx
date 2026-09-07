import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-title';
import { notFound } from 'next/navigation';
import { MahjongBreadcrumb } from '@/components/mahjong-nav';
import { MahjongGallery, MahjongViewMore } from '@/components/mahjong-gallery';
import {
  allMahjongTabParams,
  getMahjongPageData,
  getMahjongTabPageData,
  mahjongTabListHref,
} from '@/lib/mahjong';

type Props = {
  params: Promise<{ tab: string }>;
};

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return allMahjongTabParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tab } = await params;
  const data = await getMahjongTabPageData(tab);
  if (!data) return pageMetadata({ title: 'Mahjong' });
  return pageMetadata({
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
  });
}

export default async function MahjongTabPage({ params }: Props) {
  const { tab } = await params;
  const [data, page] = await Promise.all([
    getMahjongTabPageData(tab),
    getMahjongPageData(),
  ]);
  if (!data) notFound();

  const hasMore = data.allCount > data.cards.length;

  return (
    <>
      <MahjongBreadcrumb tabs={page.tabs} />
      <MahjongGallery cards={data.cards} />
      {hasMore ? <MahjongViewMore href={mahjongTabListHref(tab)} /> : null}
    </>
  );
}
