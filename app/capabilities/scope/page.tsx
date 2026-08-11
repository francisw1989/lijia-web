import type { Metadata } from 'next';
import { CapabilitiesShell } from '@/components/capabilities-shell';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { getScopePageData } from '@/lib/capabilities';
import { ScopeContent } from './content';

/** 构建时生成静态页；不读 searchParams，避免被标成动态 */
export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getScopePageData();
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function ScopePage() {
  const { hero, items } = await getScopePageData();

  return (
    <>
      <section className="about-hero container">
        <HeroMedia src={hero.image} poster={hero.poster} alt={hero.title} priority />
        <HeroBannerCopy title={hero.title} subtitle={hero.subtitle} />
      </section>

      <CapabilitiesShell>
        <ScopeContent items={items} />
      </CapabilitiesShell>
    </>
  );
}
