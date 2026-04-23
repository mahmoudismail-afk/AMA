'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  UserCheck,
  DollarSign,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Dumbbell,
  Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, id: 'dashboard' },
  { href: '/members',    label: 'Members',    icon: Users,           id: 'members' },
  { href: '/checkins',   label: 'Check-ins',  icon: CheckSquare,     id: 'checkins' },
  { href: '/classes',    label: 'Classes',    icon: Calendar,        id: 'classes' },
  { href: '/payments',   label: 'Payments',   icon: DollarSign,      id: 'payments' },
  { href: '/plans',      label: 'Plans',      icon: CreditCard,      id: 'plans' },
  { href: '/trainers',   label: 'Trainers',   icon: UserCheck,       id: 'trainers' },
  { href: '/reports',    label: 'Reports',    icon: BarChart3,       id: 'reports' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  role?: string;
  staffPermissions?: string[];
}

export default function Sidebar({ mobileOpen, onClose, role = 'staff', staffPermissions = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = role === 'admin';

  const visibleItems = NAV_ITEMS.filter(
    (item) => isAdmin || staffPermissions.includes(item.id)
  );

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Dumbbell size={22} />
        </div>
        {!collapsed && <span className="sidebar-logo-text">AMA Gym</span>}
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        id="sidebar-toggle-btn"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ padding: '0.5rem 1rem', marginBottom: '0.25rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '0.2rem 0.6rem', borderRadius: 9999,
            background: isAdmin ? 'rgba(108,99,255,0.15)' : 'rgba(16,185,129,0.12)',
            color: isAdmin ? 'var(--primary-light)' : 'var(--success)',
          }}>
            <Shield size={10} />
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="sidebar-section-label">Main Menu</span>}
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="sidebar-link-icon" />
              {!collapsed && <span>{label}</span>}
              {isActive && !collapsed && <span className="sidebar-active-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        {!collapsed && <span className="sidebar-section-label">Account</span>}
        <Link
          href="/settings"
          className={`sidebar-link ${pathname.startsWith('/settings') ? 'sidebar-link-active' : ''}`}
          title={collapsed ? 'Settings' : undefined}
          id="settings-link"
        >
          <Settings size={20} className="sidebar-link-icon" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Log out' : undefined}
          id="logout-btn"
        >
          <LogOut size={20} className="sidebar-link-icon" />
          {!collapsed && <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>}
        </button>
      </div>
    </aside>
  );
}
