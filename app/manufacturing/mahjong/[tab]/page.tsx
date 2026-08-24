import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MahjongBreadcrumb } from '@/components/mahjong-nav';
import {
  allMahjongTabParams,
  getMahjongPageData,
  getMahjongTabPageData,
  planMahjongSpans,
  type MahjongCard,
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

function MahjongCardMedia({
  card,
  span,
  priority,
}: {
  card: MahjongCard;
  span: number;
  priority: boolean;
}) {
  if (card.mediaType === 'video') {
    if (card.poster) {
      return (
        <Image
          src={card.poster}
          alt={card.title}
          fill
          unoptimized={isCmsAssetUrl(card.poster)}
          className="object-cover"
          sizes={
            span >= 2
              ? '(max-width: 800px) 100vw, 50vw'
              : '(max-width: 800px) 100vw, 25vw'
          }
          priority={priority}
        />
      );
    }
    return (
      <video
        className="mj-card-video"
        src={card.image}
        muted
        playsInline
        preload="metadata"
        aria-hidden
      />
    );
  }

  return (
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
      priority={priority}
    />
  );
}

function MahjongCardItem({
  card,
  span,
  priority,
}: {
  card: MahjongCard;
  span: number;
  priority: boolean;
}) {
  const body = (
    <>
      <h2 className="mj-card-title">{card.title}</h2>
      <div className="mj-card-media">
        <MahjongCardMedia card={card} span={span} priority={priority} />
      </div>
    </>
  );

  if (card.href) {
    return (
      <Link
        href={card.href}
        className={`mj-card mj-card-link mj-card--span-${span}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <article className={`mj-card mj-card--span-${span}`}>{body}</article>
  );
}

export default async function MahjongTabPage({ params }: Props) {
  const { tab } = await params;
  const [data, page] = await Promise.all([
    getMahjongTabPageData(tab),
    getMahjongPageData(),
  ]);
  if (!data) notFound();

  const { cards } = data;
  const spans = planMahjongSpans(cards.length);

  return (
    <>
      <MahjongBreadcrumb tabs={page.tabs} />
      <div className="mj-gallery">
        {cards.map((card, index) => (
          <MahjongCardItem
            key={card.id}
            card={card}
            span={spans[index] ?? 1}
            priority={index === 0}
          />
        ))}
      </div>
    </>
  );
}
