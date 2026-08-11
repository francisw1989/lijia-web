/** 根据 URL 或显式 coverType 判断是否为视频资源 */
export function isVideoMediaUrl(url: string, coverType?: string) {
  if (coverType === 'video') return true;
  if (coverType === 'image' || coverType === 'document') return false;
  return /\.(mp4|webm|mov|m4v|avi|mkv|ogg)(\?|$)/i.test(url || '');
}

/** 栏目 banner：主媒体 URL + 视频封面 */
export function categoryBannerMedia(category?: {
  image?: string | null;
  banner_type?: string | null;
  banner_cover?: string | null;
} | null) {
  const image = String(category?.image || '').trim();
  const isVideo =
    category?.banner_type === 'video' ||
    isVideoMediaUrl(image, category?.banner_type || undefined);
  return {
    image,
    poster: isVideo ? String(category?.banner_cover || '').trim() : '',
  };
}
