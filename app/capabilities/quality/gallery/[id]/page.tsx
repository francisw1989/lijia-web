import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/site-title';
import { CapabilitiesNav } from '@/components/capabilities-nav';
import { HeroBannerCopy } from '@/components/hero-banner-copy';
import { HeroMedia } from '@/components/hero-media';
import { FacilitiesGalleryGrid } from '@/app/about/facilities/gallery/[id]/content';
import {
  getQualityAlbumById,
  getQualityAlbumParams,
  getQualityPageData,
} from '@/lib/capabilities';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getQualityAlbumParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getQualityAlbumById(id);
  if (!album) return pageMetadata({ title: 'Gallery not found' });
  return pageMetadata({
    title: `${album.label} | Quality Control`,
    description: `Browse all ${album.label} photos from Lijia Quality Control.`,
  });
}

export default async function QualityGalleryPage({ params }: Props) {
  const { id } = await params;
  const [{ meta, hero }, album] = await Promise.all([
    getQualityPageData(),
    getQualityAlbumById(id),
  ]);

  if (!album) notFound();

  return (
    <>
      <section className="about-hero container">
        {hero.image ? (
          <HeroMedia
            src={hero.image}
            poster={hero.poster}
            alt={hero.title || meta.title}
            priority
          />
        ) : null}
        <HeroBannerCopy title={hero.title} subtitle={hero.subtitle} />
        {!hero.title ? <h1 className="sr-only">{meta.title}</h1> : null}
      </section>

      <div className="container page-tabs-wrap">
        <CapabilitiesNav />
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <Link href="/capabilities/quality" className="about-news-more">
          &lt; back to Quality Control
        </Link>
        <h1 className="about-news-detail-title">{album.label}</h1>
        <FacilitiesGalleryGrid album={album} />
      </div>
    </>
  );
}
