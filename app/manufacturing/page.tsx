import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroMedia } from '@/components/hero-media';
import { getManufacturingPageData, type MfgComponent } from '@/lib/manufacturing';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getManufacturingPageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

function MfgCard({ item }: { item: MfgComponent }) {
  return (
    <Link href={item.href} className="mfg-card">
      <span className="mfg-card-icon" aria-hidden="true">
        {item.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mfg-card-icon-default"
            src={item.icon}
            alt=""
            width={72}
            height={72}
          />
        ) : null}
        {item.iconHover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mfg-card-icon-hover"
            src={item.iconHover}
            alt=""
            width={72}
            height={72}
          />
        ) : null}
      </span>
      <div className="mfg-card-head">
        <h2 className="mfg-card-title">{item.title}</h2>
        <span className="mfg-card-arrow" aria-hidden="true" />
      </div>
      <p className="mfg-card-desc">{item.desc}</p>
    </Link>
  );
}

export default async function ManufacturingPage() {
  const { hero, items } = await getManufacturingPageData();

  return (
    <>
      <section className="about-hero mfg-hero container">
        {hero.image ? (
          <HeroMedia src={hero.image} poster={hero.poster} alt="Lijia manufacturing" priority />
        ) : null}
        <div className="mask mask-dark mfg-hero-mask" />
        <div className="mfg-hero-inner">
          <h1 className="mfg-hero-title">{hero.title}</h1>
          <ul className="mfg-hero-list">
            {hero.questions.map((q) => (
              <li key={q.mark} className="mfg-hero-q">
                <span className="mfg-hero-key">{q.mark}</span>
                <p className="mfg-hero-q-text flex1">{q.text}</p>
              </li>
            ))}
          </ul>
          <div className="mfg-hero-foot">
            <p className="mfg-hero-concern">{hero.concern}</p>
            <p className="mfg-hero-closing">
              {hero.closing}{' '}
              <a href={`mailto:${hero.email}`}>{hero.email}</a>
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="mfg-grid" suppressHydrationWarning>
            {items.map((item) => (
              <MfgCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
