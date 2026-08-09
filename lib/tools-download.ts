/** 同源代理下载链接（客户端可用） */
export function toolsDownloadHref(fileUrl: string, fileName: string) {
  const qs = new URLSearchParams({
    url: fileUrl,
    name: fileName,
  });
  return `/api/download?${qs.toString()}`;
}
