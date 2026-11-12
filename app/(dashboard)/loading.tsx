// Shown instantly while a dashboard page's server data is loading.
export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="page-header">
        <div>
          <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 'var(--radius-md)' }} />
      </div>

      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '25%', height: 10 }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 'var(--radius-full)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
