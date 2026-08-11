/** 栏目 banner 叠字：有文案才渲染 */
export function HeroBannerCopy({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const heading = title?.trim() || '';
  const lead = subtitle?.trim() || '';
  if (!heading && !lead) return null;

  return (
    <div className="cap-hero-inner cap-hero-banner">
      {heading ? <h1 className="cap-hero-title">{heading}</h1> : null}
      {lead ? <p className="cap-hero-lead">{lead}</p> : null}
    </div>
  );
}
