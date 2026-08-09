import type { Metadata } from 'next';
import Image from 'next/image';
import { CapabilitiesShell } from '@/components/capabilities-shell';
import { getScopePageData } from '@/lib/capabilities';
import { isCmsAssetUrl } from '@/lib/cms-asset';
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
      <section className="reveal about-hero container">
        {hero.image ? (
          <Image
            src={hero.image}
            alt={hero.title}
            fill
            priority
            unoptimized={isCmsAssetUrl(hero.image)}
            className="object-cover"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />
        ) : null}
        <div className="cap-hero-inner cap-hero-banner">
          <h1 className="cap-hero-title">{hero.title}</h1>
          {hero.subtitle ? (
            <p className="cap-hero-lead">{hero.subtitle}</p>
          ) : null}
        </div>
      </section>

      <CapabilitiesShell>
        <ScopeContent items={items} />
      </CapabilitiesShell>
    </>
  );
}
