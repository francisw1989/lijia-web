/** 悬停标题去掉常见图片后缀，如 Premises 01.gif → Premises 01 */
export function imageTitle(value: string) {
  return value.replace(/\.(gif|jpe?g|png|webp|avif|bmp|svg|tiff?)$/i, '').trim();
}

function MagnifierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 图集悬停：放大镜居中下滑入，标题底部上滑入 */
export function GalleryImgHover({ title }: { title?: string }) {
  const label = title?.trim() ? imageTitle(title) : '';
  return (
    <span className="facilities-img-hover">
      <MagnifierIcon />
      {label ? <span className="facilities-img-title">{label}</span> : null}
    </span>
  );
}
