'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Search, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime, getInitials, timeAgo } from '@/lib/utils';

interface CheckinsClientProps {
  checkIns: any[];
  members: any[];
}

export default function CheckinsClient({ checkIns: initial, members }: CheckinsClientProps) {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState(initial);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const filtered = members.filter((m) =>
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCheckIn(memberId: string, memberName: string) {
    setLoading(memberId);
    const supabase = createClient();
    const { data: newCi } = await supabase
      .from('check_ins')
      .insert({ member_id: memberId })
      .select('*, member:members(profile:profiles(full_name, avatar_url))')
      .single();

    if (newCi) {
      setCheckIns((prev) => [newCi, ...prev]);
      setSuccess(`${memberName} checked in!`);
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(null);
    setSearch('');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Check-ins</h1>
          <p className="page-subtitle">Record and view member gym attendance</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Check-in Panel */}
        <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + 1rem)' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} style={{ color: 'var(--primary-light)' }} /> Manual Check-in
          </h3>

          {success && (
            <div className="alert alert-success animate-fade" style={{ marginBottom: '1rem' }}>
              <CheckSquare size={15} /> {success}
            </div>
          )}

          <div className="search-input-wrapper" style={{ maxWidth: '100%', marginBottom: '1rem' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search active members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="checkin-search"
            />
          </div>

          {search && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 320, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.5rem' }}>No active members found.</p>
              ) : (
                filtered.map((m) => {
                  const name = m.profile?.full_name ?? 'Unknown';
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleCheckIn(m.id, name)}
                      disabled={loading === m.id}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', gap: '0.75rem', padding: '0.625rem 0.875rem' }}
                      id={`checkin-${m.id}`}
                    >
                      <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{getInitials(name)}</div>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      {loading === m.id && <span className="spinner" style={{ marginLeft: 'auto' }} />}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {!search && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Type a member&apos;s name above to check them in.
            </p>
          )}
        </div>

        {/* Log Panel */}
        <div className="card">
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Check-in Log <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.875rem' }}>({checkIns.length})</span>
          </h3>

          {checkIns.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon"><CheckSquare size={24} /></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No check-ins recorded yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table" id="checkins-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Time</th>
                    <th>Relative</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.map((ci) => {
                    const name = ci.member?.profile?.full_name ?? 'Unknown';
                    return (
                      <tr key={ci.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div className="avatar avatar-sm">{getInitials(name)}</div>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{name}</span>
                          </div>
                        </td>
                        <td>{formatDateTime(ci.checked_in_at)}</td>
                        <td>
                          <span className="badge badge-success">{timeAgo(ci.checked_in_at)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
