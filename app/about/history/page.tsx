import type { Metadata } from 'next';
import { AboutBanner } from '@/components/about-banner';
import { AboutShell } from '@/components/about-shell';
import { getAboutSection } from '@/lib/about';
import { getStoryNodes } from '@/lib/history';
import { AboutStorySwiper } from './story-swiper';

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getAboutSection('history');
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function AboutHistoryPage() {
  const [{ banner }, nodes] = await Promise.all([
    getAboutSection('history'),
    getStoryNodes(),
  ]);

  return (
    <>
      <AboutBanner src={banner.image} alt={banner.alt} />
      <AboutShell>
        <AboutStorySwiper nodes={nodes} />
      </AboutShell>
    </>
  );
}
