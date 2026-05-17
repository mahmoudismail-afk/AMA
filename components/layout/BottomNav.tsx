'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CreditCard,
  Receipt,
  ShoppingCart,
  History,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

const PRIMARY_NAV = [
  { href: '/dashboard', label: 'Home',     icon: LayoutDashboard, id: 'dashboard' },
  { href: '/members',   label: 'Members',  icon: Users,           id: 'members' },
  { href: '/payments',  label: 'Payments', icon: DollarSign,      id: 'payments' },
  { href: '/plans',     label: 'Plans',    icon: CreditCard,      id: 'plans' },
];

const MORE_NAV = [
  { href: '/expenses',  label: 'Expenses',  icon: Receipt,      id: 'expenses' },
  { href: '/inventory', label: 'Inventory', icon: ShoppingCart, id: 'inventory' },
  { href: '/history',   label: 'History',   icon: History,      id: 'history' },
  { href: '/settings',  label: 'Settings',  icon: Settings,     id: 'settings' },
];

interface BottomNavProps {
  role?: string;
  staffPermissions?: string[];
}

export default function BottomNav({ role = 'staff', staffPermissions = [] }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = role === 'admin';

  const canSee = (id: string) => isAdmin || staffPermissions.includes(id);

  const visiblePrimary = PRIMARY_NAV.filter(i => canSee(i.id));
  const visibleMore    = MORE_NAV.filter(i => canSee(i.id));

  const isMoreActive = MORE_NAV.some(i =>
    pathname === i.href || pathname.startsWith(i.href + '/')
  );

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          className="bottom-nav-overlay"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="bottom-nav-drawer">
          <div className="bottom-nav-drawer-header">
            <span>More</span>
            <button onClick={() => setMoreOpen(false)} className="bottom-nav-drawer-close">✕</button>
          </div>
          <div className="bottom-nav-drawer-grid">
            {visibleMore.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`bottom-nav-drawer-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreOpen(false)}
                >
                  <div className="bottom-nav-drawer-icon">
                    <Icon size={22} />
                  </div>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {visiblePrimary.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          );
        })}

        {visibleMore.length > 0 && (
          <button
            className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
            onClick={() => setMoreOpen(prev => !prev)}
            aria-label="More navigation options"
          >
            <MoreHorizontal size={22} />
            <span>More</span>
          </button>
        )}
      </nav>
    </>
  );
}
