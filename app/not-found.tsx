import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="card empty-state" style={{ maxWidth: 440, width: '100%' }}>
        <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>404</p>
        <h3 style={{ color: 'var(--text-primary)' }}>Page not found</h3>
        <p style={{ fontSize: '0.875rem' }}>The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
        <Link href="/dashboard" className="btn btn-primary">Back to dashboard</Link>
      </div>
    </div>
  );
}
