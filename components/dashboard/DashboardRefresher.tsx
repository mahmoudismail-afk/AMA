'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Invisible component that auto-refreshes the dashboard at the start of a new month.
 * It also refreshes every 5 minutes to keep daily/weekly revenue current.
 */
export default function DashboardRefresher() {
  const router = useRouter();
  const mountedMonth = useRef(new Date().getMonth());

  useEffect(() => {
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      const currentMonth = new Date().getMonth();
      // If the month has rolled over since this component mounted, hard-refresh
      if (currentMonth !== mountedMonth.current) {
        mountedMonth.current = currentMonth;
      }
      router.refresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
