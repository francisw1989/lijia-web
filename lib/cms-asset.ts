/** CMS / R2 公网图：Cloudflare 会拦截 Next 服务端拉图，需跳过优化由浏览器直连 */
export function isCmsAssetUrl(src: string) {
  try {
    const host = new URL(src).hostname;
    return host === 'images.wangsanshui.com' || host.endsWith('.wangsanshui.com');
  } catch {
    return false;
  }
}
