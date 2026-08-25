import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FacilitiesHero } from '@/components/facilities-hero';
import { AboutShell } from '@/components/about-shell';
import {
  getAboutSection,
  getFacilityAlbum,
  getFacilityAlbumParams,
} from '@/lib/about';
import { FacilitiesGalleryGrid } from './content';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getFacilityAlbumParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getFacilityAlbum(id);
  if (!album) return { title: 'Gallery not found' };
  return {
    title: `${album.label} | Our Facilities`,
    description: `Browse all ${album.label} photos from Lijia Our Facilities.`,
  };
}

export default async function FacilitiesGalleryPage({ params }: Props) {
  const { id } = await params;
  const [{ banner }, album] = await Promise.all([
    getAboutSection('facilities'),
    getFacilityAlbum(id),
  ]);

  if (!album) notFound();

  return (
    <>
      <FacilitiesHero
        src={banner.image}
        poster={banner.poster}
        alt={banner.alt}
        title={banner.title}
        subtitle={banner.subtitle}
      />
      <AboutShell>
        <Link href="/about/facilities" className="about-news-more">
          &lt; back to Our Facilities
        </Link>
        <h1 className="about-news-detail-title">{album.label}</h1>
        <FacilitiesGalleryGrid album={album} />
      </AboutShell>
    </>
  );
}
