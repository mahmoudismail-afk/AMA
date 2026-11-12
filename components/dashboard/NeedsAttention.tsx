'use client';

import Link from 'next/link';
import { AlertTriangle, MessageCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { buildReminderUrl } from '@/lib/whatsapp';

export interface AttentionItem {
  memberId: string;
  name: string;
  phone: string | null;
  planName: string | null;
  endDate: string;
  daysLeft: number;
}

function daysLabel(d: number) {
  if (d < 0) return `Expired ${Math.abs(d)}d ago`;
  if (d === 0) return 'Expires today';
  if (d === 1) return 'Expires tomorrow';
  return `${d} days left`;
}

/** Dashboard panel: memberships that expire within 3 days or expired in the last 7 days. */
export default function NeedsAttention({ items }: { items: AttentionItem[] }) {
  return (
    <section className="card" style={{ marginBottom: '1.5rem' }} aria-labelledby="needs-attention-title">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          <h3 id="needs-attention-title" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
            Needs attention
          </h3>
          {items.length > 0 && <span className="badge badge-warning">{items.length}</span>}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Expiring within 3 days or expired in the last 7 days
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
          All good — no memberships need follow-up right now.
        </div>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((it) => {
            const tone = it.daysLeft < 0 ? 'var(--danger)' : 'var(--warning)';
            const toneBg = it.daysLeft < 0 ? 'var(--danger-bg)' : 'var(--warning-bg)';
            return (
              <li
                key={it.memberId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                  padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)',
                }}
              >
                <div className="avatar avatar-sm">{getInitials(it.name)}</div>
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <Link href={`/members/${it.memberId}`} style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {it.name}
                  </Link>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {it.planName ?? 'No plan'}{it.phone ? ` · ${it.phone}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.55rem', borderRadius: 999, color: tone, background: toneBg }}>
                  {daysLabel(it.daysLeft)}
                </span>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {it.phone && (
                    <a
                      href={buildReminderUrl(it.phone, it.name, it.daysLeft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#25D366' }}
                      aria-label={`Send WhatsApp reminder to ${it.name}`}
                    >
                      <MessageCircle size={14} /> Remind
                    </a>
                  )}
                  <Link href={`/members/${it.memberId}`} className="btn btn-primary btn-sm" aria-label={`Renew ${it.name}`}>
                    <RefreshCw size={14} /> Renew
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
