/** 前台正式域名；部署时用 NEXT_PUBLIC_SITE_URL 覆盖 */
export const SITE_NAME = 'LIJIA GAME';
export const SITE_LEGAL_NAME = 'Lijia Game Production Co., Ltd.';
export const SITE_DESCRIPTION =
  'Lijia Game Production Co., Ltd. is a professional game manufacturer from China. Lijia Games occupies a 15,840 square metre modern facilities. The company has continually invested in automation and equipment to ensure it stays at the leading edge of technology and manufacturing of toy and game industry.';

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return (vercel.startsWith('http') ? vercel : `https://${vercel}`).replace(
      /\/$/,
      '',
    );
  }

  return 'https://www.lijiagames.com';
}

export function absoluteUrl(path = '/') {
  const base = getSiteUrl();
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
