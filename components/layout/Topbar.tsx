'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Search, Menu, Settings } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  role?: string;
  onMenuClick?: () => void;
}

export default function Topbar({ userName, userEmail, avatarUrl, role, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K or "/" focuses the member search from anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/members?status=all&q=${encodeURIComponent(q)}` : '/members');
    searchRef.current?.blur();
  }

  return (
    <header className="topbar">
      {/* Mobile menu button — opens full sidebar for extra pages */}
      <button
        className="btn btn-ghost btn-icon topbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle menu"
        id="topbar-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Member search — Enter jumps to the Members page with results (Ctrl+K / "/" to focus) */}
      <form className="topbar-search" role="search" onSubmit={handleSearch}>
        <Search size={16} className="topbar-search-icon" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search members by name or phone…  (Ctrl+K)"
          className="topbar-search-input"
          id="topbar-search"
          aria-label="Search members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="topbar-actions">
        {/* Settings link — visible on mobile next to avatar */}
        <Link
          href="/settings"
          className={`btn btn-ghost btn-icon topbar-settings-btn ${pathname.startsWith('/settings') ? 'topbar-settings-active' : ''}`}
          aria-label="Settings"
          id="topbar-settings-btn"
        >
          <Settings size={20} />
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <div className="topbar-user" id="topbar-user">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={userName ?? 'User'} className="avatar avatar-sm" />
          ) : (
            <div className="avatar avatar-sm">
              {getInitials(userName ?? 'U')}
            </div>
          )}
          <div className="topbar-user-info">
            <span className="topbar-user-name">{userName ?? 'Admin'}</span>
            {userEmail ? (
              <span className="topbar-user-email">{userEmail}</span>
            ) : (
              <span className="topbar-user-email" style={{
                color: role === 'admin' ? 'var(--primary-light)' : 'var(--success)',
                fontWeight: 600,
              }}>
                {role === 'admin' ? '👑 Admin' : '👷 Staff'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
