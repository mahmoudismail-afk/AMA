'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface DashboardShellProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  role: string;
  staffPermissions?: string[];
  children: React.ReactNode;
}

export default function DashboardShell({ userName, userEmail, avatarUrl, role, staffPermissions, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="dashboard-shell">
      {/* Overlay backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} role={role} staffPermissions={staffPermissions} />

      <div className="dashboard-main">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          role={role}
          onMenuClick={() => setMobileOpen(prev => !prev)}
        />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
