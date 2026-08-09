/** 客户端可用的 Tools 静态文案/资源（勿从此文件 import CMS） */

export type ToolsResourceCard = {
  id: 'terms' | 'safety' | 'dice' | 'faq';
  title: string;
  href: string;
  icon: string;
};

export type ToolsVideoItem = {
  id: number;
  title: string;
  description: string;
  src: string;
  poster: string;
};

export const TOOLS_INTRO =
  'Great tools and information can help you understand your options and obligations and it helps us make the best game possible for you. We hope the resources on this page will help you on your game making journey.';

export const TOOL_GENERATOR = {
  title: 'Template Generator',
  href: '#',
  icon: '/images/t/5.png',
} as const;

export const TOOL_VIDEOS = [
  {
    id: 'main',
    title: 'Printing & finishing line',
    poster:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    autoplay: true,
  },
  {
    id: 'v1',
    title: 'Assembly tips',
    poster:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'v2',
    title: 'Quality inspection',
    poster:
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'v3',
    title: 'Component packing',
    poster:
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'v4',
    title: 'Factory tour',
    poster: '/images/history/2019.jpg',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
] as const;

export const SAMPLE_BOX = {
  title: 'LIJIA GAME Basic sample box',
  desc: 'Afterwards, we will provide you for free a sample of our latest project, which has carefully prepared various game accessories.',
  image: '/images/19.png',
};
