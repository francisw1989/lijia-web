'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { isCmsAssetUrl } from '@/lib/cms-asset';

export type NewsCardItem = {
  id: number;
  title: string;
  description?: string | null;
  created_at: string;
  category_name?: string | null;
  keywords?: string | null;
  cover?: string | null;
  /** 默认 /about/news/:id */
  href?: string;
};

const FALLBACKS = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
];

function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function NewsCarousel({ items }: { items: NewsCardItem[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const [pages, setPages] = useState(1);

  const syncPages = (swiper: SwiperType) => {
    setPages(Math.max(1, swiper.snapGrid.length));
    setActive(swiper.snapIndex);
  };

  return (
    <div className="news-carousel">
      <div className="news-carousel-head container">
        <h2 className="title text-left mb0">Latest News</h2>
        <div className="flex-row gap-24">
          <button
            type="button"
            className="news-nav-btn"
            aria-label="Previous news"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <Image src="/images/9.png" alt="" width={36} height={36} />
          </button>
          <button
            type="button"
            className="news-nav-btn"
            aria-label="Next news"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <Image src="/images/10.png" alt="" width={36} height={36} />
          </button>
        </div>
      </div>

      <Swiper
        className="news-swiper"
        modules={[Autoplay]}
        spaceBetween={20}
        slidesPerView={1.15}
        grabCursor
        simulateTouch
        watchOverflow
        loop
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          640: { slidesPerView: 1.4, spaceBetween: 16 },
          801: { slidesPerView: 2.2, spaceBetween: 20 },
          1100: { slidesPerView: 3, spaceBetween: 24 },
          1400: { slidesPerView: 3.4, spaceBetween: 24 },
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          syncPages(swiper);
        }}
        onSlideChange={syncPages}
        onBreakpoint={syncPages}
        onResize={syncPages}
      >
        {items.map((item, index) => {
          const href =
            item.href ||
            (item.id > 0 ? `/about/news/${item.id}` : '/about/news');
          const cover = item.cover || FALLBACKS[index % FALLBACKS.length];
          const title = item.title?.trim() || '';
          const category =
            item.keywords?.trim() ||
            item.category_name?.trim() ||
            'News';
          const tagClass = /story|user/i.test(category) ? 'tag tag-warm' : 'tag';
          return (
            <SwiperSlide key={`${item.id}-${index}`}>
              <article className="card news-slide">
                <Link href={href} className="media aspect-16-10 relative">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    unoptimized={isCmsAssetUrl(cover)}
                    className="object-cover"
                    sizes="(max-width: 800px) 85vw, (max-width: 1100px) 45vw, 30vw"
                  />
                </Link>
                <div className="pad20 news-slide-body">
                  <div className="flex-row-middle flex-row-between gap-8 mb12 font14 col-muted news-slide-meta">
                    <time>{formatDate(item.created_at)}</time>
                    <span className={tagClass}>{category}</span>
                  </div>
                  <h3 className="font24 font-bold mt16 news-slide-title">
                    <Link href={href}>{title}</Link>
                  </h3>
                  {item.description ? (
                    <p className="desc clamp-2 font16 mt16">{item.description}</p>
                  ) : null}
                  <div className="news-slide-more">
                    <Link href={href} className="link-more">
                      learn more ›
                    </Link>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="news-carousel-pager flex-row-center gap-8 mt24">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`pager-bar${i === active ? ' pager-bar-active' : ''}`}
            aria-label={`Go to page ${i + 1}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => swiperRef.current?.slideTo(i)}
          />
        ))}
      </div>

      <div className="flex-row-center mt36">
        <Link href="/about/news" className="btn btn-primary btn-pill">
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
    </div>
  );
}
