export default function Loading() {
  return (
    <div className="container page-section" role="status" aria-label="Loading">
      <div className="skeleton skeleton-title" />
      <div className="product-grid">
        {[1, 2, 3, 4].map((n) => (
          <div key={n}>
            <div className="skeleton skeleton-product" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
