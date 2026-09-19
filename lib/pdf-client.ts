/** 微信内置浏览器（不支持 blob / a.download） */
export function isWeChatBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent || '');
}

/** 手机端 PDF 倾向下载而非新标签预览 */
export function isMobilePdfClient() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPod|Mobile/i.test(ua)) return true;
  // iPadOS 13+ 常伪装成 Mac
  if (navigator.maxTouchPoints > 1 && /Mac|iPad/i.test(ua)) return true;
  return false;
}
