'use client';

import { useState } from 'react';
import { toolsDownloadHref } from '@/lib/tools-download';
import { isWeChatBrowser } from '@/lib/pdf-client';

type Props = {
  fileUrl: string;
  fileName: string;
};

/** 客户端拉取 blob 再另存为，确保文件名不是 R2 哈希 */
export function ToolsDocDownload({ fileUrl, fileName }: Props) {
  const [busy, setBusy] = useState(false);
  const href = toolsDownloadHref(fileUrl, fileName);

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (busy) return;
    // 微信内 blob / a.download 无效，直接跳转同源下载接口
    if (isWeChatBrowser()) {
      window.location.assign(href);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('[ToolsDocDownload]', err);
      window.location.href = href;
    } finally {
      setBusy(false);
    }
  };

  return (
    <a
      className="btn btn-primary btn-pill tools-doc-download"
      href={href}
      download={fileName}
      onClick={onClick}
      aria-disabled={busy}
    >
      {busy ? 'Downloading…' : 'Download'}
    </a>
  );
}
