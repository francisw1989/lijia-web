import Image from 'next/image';
import { MahjongNav } from '@/components/mahjong-nav';
import { getMahjongPageData } from '@/lib/mahjong';
import { isCmsAssetUrl } from '@/lib/cms-asset';

/** 各 Tab 独立页共用 layout：banner 只取一级栏目 Mahjong 主图 */
export default async function MahjongLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hero, tabs } = await getMahjongPageData();

  return (
    <>
      <section className="about-hero container">
        {hero.image ? (
          <Image
            key={hero.image}
            src={hero.image}
            alt={hero.alt || 'Mahjong'}
            fill
            priority
            unoptimized={isCmsAssetUrl(hero.image)}
            className="object-cover"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />
        ) : null}
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="page-tabs-wrap mj-tabs-wrap">
            <MahjongNav tabs={tabs} />
          </div>
          {children}
        </div>
      </section>
    </>
  );
}
