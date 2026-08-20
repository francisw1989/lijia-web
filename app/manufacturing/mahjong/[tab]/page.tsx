import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  allMahjongTabParams,
  getMahjongTabPageData,
  planMahjongSpans,
} from '@/lib/mahjong';
import { isCmsAssetUrl } from '@/lib/cms-asset';

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
  if (!data) return { title: 'Mahjong' };
  return {
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
  };
}

export default async function MahjongTabPage({ params }: Props) {
  const { tab } = await params;
  const data = await getMahjongTabPageData(tab);
  if (!data) notFound();

  const { cards } = data;
  const spans = planMahjongSpans(cards.length);

  return (
    <div className="mj-gallery">
      {cards.map((card, index) => {
        const span = spans[index] ?? 1;
        return (
          <article
            key={card.id}
            className={`mj-card mj-card--span-${span}`}
          >
            <h2 className="mj-card-title">{card.title}</h2>
            <div className="mj-card-media">
              {card.mediaType === 'video' ? (
                <video
                  className="mj-card-video"
                  src={card.image}
                  poster={card.poster || undefined}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={card.title}
                />
              ) : (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  unoptimized={isCmsAssetUrl(card.image)}
                  className="object-cover"
                  sizes={
                    span >= 2
                      ? '(max-width: 800px) 100vw, 50vw'
                      : '(max-width: 800px) 100vw, 25vw'
                  }
                  priority={index === 0}
                />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
