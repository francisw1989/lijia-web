/** 进入 /capabilities/scope 时先占位，避免等 CMS 期间整页空白闪一下 */
export default function ScopeLoading() {
  return (
    <>
      <section className="about-hero cap-scope-skeleton-hero" aria-hidden />
      <section className="cap-shell">
        <div className="container">
          <div className="page-tabs cap-scope-skeleton-tabs" aria-hidden>
            <span className="about-tab is-active">Scope of capabilities</span>
            <span className="about-tab">Quality Control</span>
          </div>
          <div className="cap-scope-skeleton-icons" aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="cap-scope-skeleton-icon" />
            ))}
          </div>
          <div className="cap-scope-skeleton-detail" aria-hidden />
        </div>
      </section>
    </>
  );
}
