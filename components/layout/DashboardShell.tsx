'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

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
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="dashboard-shell">
      {/* Overlay backdrop for mobile sidebar (tablet only, not small phones) */}
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

      {/* Sidebar — desktop only */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={role}
        staffPermissions={staffPermissions}
      />

      <div className="dashboard-main">
        {/* Topbar */}
        <Topbar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          role={role}
          onMenuClick={() => setMobileOpen(prev => !prev)}
        />

        {/* Page content — extra bottom padding on mobile for BottomNav */}
        <main className={`dashboard-content${isMobile ? ' dashboard-content-mobile' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <BottomNav role={role} staffPermissions={staffPermissions} />
    </div>
  );
}
