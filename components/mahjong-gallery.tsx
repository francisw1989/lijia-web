import Image from 'next/image';
import Link from 'next/link';
import type { MahjongCard } from '@/lib/mahjong';
import { planMahjongSpans } from '@/lib/mahjong';
import { isCmsAssetUrl } from '@/lib/cms-asset';

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
      {card.image ? (
        <div className="mj-card-media">
          <MahjongCardMedia card={card} span={span} priority={priority} />
        </div>
      ) : null}
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

export function MahjongGallery({ cards }: { cards: MahjongCard[] }) {
  const spans = planMahjongSpans(cards.length);

  return (
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
  );
}

export function MahjongViewMore({ href }: { href: string }) {
  return (
    <div className="flex-row-center mt36">
      <Link href={href} className="btn btn-primary btn-pill">
        View More
        <Image
          src="/images/6.png"
          alt=""
          width={16}
          height={16}
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
