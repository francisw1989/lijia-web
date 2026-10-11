import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.wangsanshui.com',
      },
    ],
  },
  async redirects() {
    return [
      // Old mahjong L3 structure → new flat L2 structure
      {
        source: '/manufacturing/mahjong/mahjong-tiles',
        destination: '/manufacturing/mahjong',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/mahjong-tiles/list',
        destination: '/manufacturing/mahjong',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/mahjong-tiles/:id',
        destination: '/manufacturing/mahjong/:id',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/domino-tiles',
        destination: '/manufacturing/domino',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/domino-tiles/list',
        destination: '/manufacturing/domino',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/domino-tiles/:id',
        destination: '/manufacturing/domino/:id',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/letter-symbol-tiles',
        destination: '/manufacturing/letter',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/letter-symbol-tiles/list',
        destination: '/manufacturing/letter',
        permanent: true,
      },
      {
        source: '/manufacturing/mahjong/letter-symbol-tiles/:id',
        destination: '/manufacturing/letter/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
