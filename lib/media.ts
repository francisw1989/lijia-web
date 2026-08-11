/** 根据 URL 或显式 coverType 判断是否为视频资源 */
export function isVideoMediaUrl(url: string, coverType?: string) {
  if (coverType === 'video') return true;
  if (coverType === 'image' || coverType === 'document') return false;
  return /\.(mp4|webm|mov|m4v|avi|mkv|ogg)(\?|$)/i.test(url || '');
}
