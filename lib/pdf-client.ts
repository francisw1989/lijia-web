/** 微信内置浏览器（不支持 blob / a.download） */
export function isWeChatBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent || '');
}

export function isWeChatAndroid() {
  if (!isWeChatBrowser()) return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function isWeChatIOS() {
  if (!isWeChatBrowser()) return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
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

/**
 * 从微信内唤起系统浏览器打开真实 https 链接。
 * - Android：intent://（可跳出微信）
 * - iOS：无法稳定程序化唤起，返回 need-manual
 */
export function openInSystemBrowser(httpsUrl: string): 'launched' | 'need-manual' {
  if (typeof window === 'undefined') return 'need-manual';

  if (isWeChatAndroid()) {
    try {
      const u = new URL(httpsUrl);
      const path = `${u.host}${u.pathname}${u.search}${u.hash}`;
      const fallback = encodeURIComponent(httpsUrl);
      window.location.href =
        `intent://${path}#Intent;` +
        'scheme=https;' +
        'action=android.intent.action.VIEW;' +
        'category=android.intent.category.BROWSABLE;' +
        `S.browser_fallback_url=${fallback};` +
        'end';
      return 'launched';
    } catch {
      // fall through
    }
  }

  if (isWeChatIOS()) {
    // 先写入带参数的真实地址，方便用户点 ··· → 在浏览器打开
    try {
      const u = new URL(httpsUrl);
      window.history.replaceState(null, '', `${u.pathname}${u.search}${u.hash}`);
    } catch {
      // ignore
    }
    // 部分旧版微信可用；失败则仍停在微信内
    try {
      window.location.href = httpsUrl.replace(/^https:\/\//i, 'x-safari-https://');
    } catch {
      // ignore
    }
    return 'need-manual';
  }

  window.open(httpsUrl, '_blank', 'noopener,noreferrer');
  return 'launched';
}
