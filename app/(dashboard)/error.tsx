'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Friendly error screen for any dashboard page (instead of the default crash page).
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card empty-state" role="alert">
      <div className="empty-state-icon" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>
        <AlertTriangle size={32} />
      </div>
      <h3 style={{ color: 'var(--text-primary)' }}>Something went wrong</h3>
      <p style={{ fontSize: '0.875rem', maxWidth: 420 }}>
        This page couldn&apos;t be loaded. Check your internet connection and try again.
        {error.digest && (
          <span style={{ display: 'block', marginTop: 6, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Error ref: {error.digest}
          </span>
        )}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={reset}>
          <RotateCcw size={16} /> Try again
        </button>
        <Link href="/dashboard" className="btn btn-secondary">Go to dashboard</Link>
      </div>
    </div>
  );
}
