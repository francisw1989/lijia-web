import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { ManufacturingCategoryMenu } from '@/components/manufacturing-category-menu';
import { MahjongNav } from '@/components/mahjong-nav';
import { getManufacturingMenuItems } from '@/lib/manufacturing';
import { getMahjongPageData } from '@/lib/mahjong';

/** 各 Tab 独立页共用 layout：banner 只取一级栏目 Mahjong 主图 */
export default async function MahjongLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ hero, tabs }, menuItems] = await Promise.all([
    getMahjongPageData(),
    getManufacturingMenuItems(),
  ]);

  return (
    <>
      <section className="about-hero container">
        {hero.image ? (
          <HeroMedia src={hero.image} poster={hero.poster} alt={hero.alt || 'Mahjong'} priority />
        ) : null}
        <HeroBannerCopy title={hero.title} subtitle={hero.subtitle} />
      </section>

      <section className="section-pad">
        <div className="container">
          <ManufacturingCategoryMenu items={menuItems} activeId="mahjong" />
          <div className="about-layout mj-layout">
            <MahjongNav tabs={tabs} />
            <div className="about-panel mj-panel">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}
