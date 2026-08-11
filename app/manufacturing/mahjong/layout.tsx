import { HeroMedia } from '@/components/hero-media';
import { MahjongNav } from '@/components/mahjong-nav';
import { getMahjongPageData } from '@/lib/mahjong';

/** 各 Tab 独立页共用 layout：banner 只取一级栏目 Mahjong 主图 */
export default async function MahjongLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hero, tabs } = await getMahjongPageData();

  return (
    <>
      <section className="about-hero">
        {hero.image ? (
          <HeroMedia src={hero.image} alt={hero.alt || 'Mahjong'} priority />
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
