import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MahjongBreadcrumb } from '@/components/mahjong-nav';
import { MahjongGallery } from '@/components/mahjong-gallery';
import {
  allMahjongTabParams,
  getMahjongPageData,
  getMahjongTabPageData,
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
  const data = await getMahjongTabPageData(tab, { all: true });
  if (!data) return { title: 'Mahjong' };
  return {
    title: `${data.meta.title} ALL`,
    description: data.meta.description,
    keywords: data.meta.keywords,
  };
}

export default async function MahjongTabListPage({ params }: Props) {
  const { tab } = await params;
  const [data, page] = await Promise.all([
    getMahjongTabPageData(tab, { all: true }),
    getMahjongPageData(),
  ]);
  if (!data) notFound();

  return (
    <>
      <MahjongBreadcrumb tabs={page.tabs} current={`${data.tab.label} ALL`} />
      <MahjongGallery cards={data.cards} />
    </>
  );
}
