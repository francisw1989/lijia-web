import Image from 'next/image';
import Link from 'next/link';
import { ConnectCta } from '@/components/connect-cta';
import { CountUp } from '@/components/count-up';
import { NewsCarousel } from '@/components/news-carousel';
import { RevealInit } from '@/components/reveal-init';
import { getNewsCarouselItems } from '@/lib/about';
import { getHomeCapabilityPanels } from '@/lib/capabilities';
import { isCmsAssetUrl } from '@/lib/cms-asset';
import { getHomepageSettings, titleLines } from '@/lib/homepage';
import { getHomeManufacturingComponents } from '@/lib/manufacturing';

const CERTS = [
  { name: 'BSCI', image: '/images/2.png' },
  { name: 'ISO', image: '/images/3.png' },
  { name: 'SEDEX', image: '/images/4.png' },
  { name: 'CE', image: '/images/5.png' },
];

const STATS = [
  {
    value: 40,
    unit: 'Years',
    title: 'YEARS EXPERIENCE',
    lines: [
      '(1986-2026) One Constant Commitment.',
      'Defining Excellence, Beyond Time.',
    ],
    href: '/about/history',
  },
  {
    value: 80,
    unit: '%',
    title: 'REPURCHASE RATE',
    lines: ['80% of our clients have partnered with us for over 10 years.'],
    href: '/certificates',
  },
  {
    value: 100,
    unit: '%',
    title: 'CLIENT SATISFACTION',
    lines: ['100% Customer Satisfaction', 'Your Win, Our Pride.'],
    href: '/capabilities/quality',
  },
];

export default async function HomePage() {
  const [home, newsArticles, capaItems, productItems] =
    await Promise.all([
      getHomepageSettings(),
      getNewsCarouselItems(12),
      getHomeCapabilityPanels(3),
      getHomeManufacturingComponents(6),
    ]);

  const { banner, presence } = home;
  const bannerTitle = titleLines(banner.title);

  const news = newsArticles.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    created_at: item.created_at,
    keywords: item.keywords,
    cover: item.cover,
    href: `/about/news/${item.id}`,
  }));

  return (
    <main>
      <RevealInit />
      <section className="relative min-h-hero place-center colfff overflow-hidden">
        <video
          className="absoluteCover object-cover"
          src={banner.videoUrl}
          poster={banner.imageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div className="mask mask-hero" />
        <div className="relative z-1 container text-center rise-in hero-content">
          <h1 className="title-lg">
            {bannerTitle.map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 ? <br className="br-desktop" /> : null}
                {index > 0 ? ' ' : null}
                {line}
              </span>
            ))}
          </h1>
          {banner.subtitle ? (
            <p className="font-medium font24 mb28 hero-lead">{banner.subtitle}</p>
          ) : null}
          <div className="flex-row-center flex-wrap gap-24 hero-actions">
            <Link href="/about/facilities" className="btn btn-light btn-lg btn-light-border">
              Learn More
            </Link>
            <Link href="/contact" className="btn btn-glass btn-lg">
              Talk to us
            </Link>
          </div>
        </div>
        <div className="cert-bar" aria-label="Certifications">
          {CERTS.map((item) => (
            <Image
              key={item.name}
              src={item.image}
              alt={item.name}
              width={100}
              height={100}
              className="h-58 w-auto"
            />
          ))}
        </div>
      </section>

      <section className="reveal section-pad">
        <div className="container">
          <h2 className="title text-center">Capabilities in Manufacturing</h2>
          <p className="lead">
          Shape future game directions. Deliver custom manufacturing, integrated smart toys (PCB/loT), and turn visionary concepts into reality.
          </p>
          <div className="capa-row">
            {capaItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="capa-panel"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  unoptimized={isCmsAssetUrl(item.image)}
                  className="object-cover"
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
                <div className="capa-panel-mask" />
                <div className="capa-panel-body">
                  <h3>{item.title}</h3>
                  {item.desc ? <p>{item.desc}</p> : null}
                </div>
              </Link>
            ))}
          </div>
          <div className="flex-row-center mt36">
            <Link href="/capabilities" className="btn btn-primary btn-pill">
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
      </section>

      <section className="reveal presence-section relative colfff overflow-hidden rounded">
        <Image
          className="object-cover"
          src={presence.imageUrl}
          alt={presence.subtitle || presence.title}
          unoptimized={isCmsAssetUrl(presence.imageUrl)}
          fill
          sizes="100vw"
        />
        <div className="relative z-1 presence-inner">
          <h2
            className="uppercase font-extrabold font40 mb8 presence-title"
            style={{ letterSpacing: '0.04em' }}
          >
            {presence.title}
          </h2>
          {presence.subtitle ? (
            <p
              className="font-medium font22 mb36 presence-sub"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {presence.subtitle}
            </p>
          ) : null}
          <div className="presence-stats">
            {STATS.map((stat) => (
              <Link
                key={stat.href}
                href={stat.href}
                className="bg-glass-card rounded pad32"
              >
                <CountUp
                  value={stat.value}
                  className="colsuccess font-extrabold font64 presence-num mb0"
                  style={{ lineHeight: 'normal' }}
                >
                  <span className="presence-unit">{stat.unit}</span>
                </CountUp>
                <div className="flex-row-middle gap-8 mb14 presence-stat-title">
                  <span>{stat.title}</span>
                  <Image
                    src="/images/6.png"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden="true"
                  />
                </div>
                <div
                  className="font14 presence-stat-copy"
                  style={{ lineHeight: 1.55, color: 'rgba(255,255,255,0.82)' }}
                >
                  {stat.lines.map((line) => (
                    <p key={line} className="mb0">
                      {line}
                    </p>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="reveal bg-muted mt32 section-pad">
        <div className="container">
          <h2 className="title text-center">Game Development Components</h2>
          <p className="lead">
            We provide essential building blocks for custom game sets — cards,
            tiles, electronics, tokens and more.
          </p>
          <div className="grid-3-gap16">
            {productItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="prod-card pad32"
              >
                <h3 className="a">{item.title}</h3>
                <h3 className="font32 font-bold b">{item.title}</h3>
                <Image
                  className="img1"
                  src={item.icon}
                  alt=""
                  width={120}
                  height={120}
                  unoptimized={isCmsAssetUrl(item.icon)}
                  aria-hidden="true"
                />
                <Image
                  className="img2"
                  src={item.iconHover || item.icon}
                  alt=""
                  width={120}
                  height={120}
                  unoptimized={isCmsAssetUrl(item.iconHover || item.icon)}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
          <div className="flex-row-center mt36">
            <Link href="/manufacturing" className="btn btn-primary btn-pill">
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
      </section>

      {news.length ? (
        <section className="reveal section-pad news-section">
          <NewsCarousel items={news} />
        </section>
      ) : null}

      <ConnectCta />
    </main>
  );
}
