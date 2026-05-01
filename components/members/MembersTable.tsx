'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { getInitials, getMemberStatusColor, formatDate } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';

interface MembersTableProps {
  members: any[];
}

export default function MembersTable({ members }: MembersTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from('members').delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3 style={{ color: 'var(--text-primary)' }}>No members found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Add your first member to get started.
        </p>
        <Link href="/members/new" className="btn btn-primary btn-sm">Add Member</Link>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table className="table" id="members-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: 'center' }}>Subscription</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => {
              const name = m.profile?.full_name ?? 'Unknown';
              const email = m.profile?.email ?? '';
              const phone = m.profile?.phone ?? '';
              const avatar = m.profile?.avatar_url;
              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar avatar-sm">
                        {avatar
                          ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : getInitials(name)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{phone || <span style={{ color: 'var(--text-disabled)' }}>—</span>}</td>
                  <td>
                    <span className={`badge ${getMemberStatusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const memberships: any[] = m.memberships ?? [];
                      const active = memberships
                        .filter((ms: any) => ms.status === 'active')
                        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
                      const earliest = memberships
                        .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
                      const date = active?.start_date ?? earliest?.start_date ?? m.created_at;

                      // Days left calculation
                      let daysLeft: number | null = null;
                      if (active?.end_date) {
                        const diff = new Date(active.end_date).getTime() - new Date().getTime();
                        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      }

                      return (
                        <div>
                          <span>{formatDate(date)}</span>
                          {daysLeft !== null && (
                            <div style={{ marginTop: '0.2rem' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                                background: daysLeft <= 0 ? 'var(--danger-bg)' : daysLeft <= 7 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                                color: daysLeft <= 0 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--success)',
                              }}>
                                {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link href={`/members/${m.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      <RefreshCw size={12} style={{ marginRight: '4px' }} /> Renew
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Link href={`/members/${m.id}`} className="btn btn-ghost btn-sm btn-icon" title="View">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/members/${m.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="Edit">
                        <Edit size={15} />
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Delete"
                        onClick={() => setDeleteId(m.id)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone and will remove all their data."
        confirmLabel="Delete Member"
        loading={deleting}
      />
    </>
  );
}
