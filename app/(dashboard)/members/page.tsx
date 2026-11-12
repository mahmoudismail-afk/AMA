import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import MembersTable from '@/components/members/MembersTable';
import MemberSearch from '@/components/members/MemberSearch';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Members' };

const STATUSES = ['all', 'active', 'inactive', 'paused', 'expired'] as const;

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  await requirePermission('members');
  const supabase = await createClient();
  const q = (resolvedSearchParams.q ?? '').trim();
  let statusRaw = resolvedSearchParams.status;

  if (statusRaw === undefined) {
    statusRaw = q ? 'all' : 'active';
  }

  const status = statusRaw === 'all' ? '' : statusRaw;

  let query = supabase
    .from('members')
    .select(`
      id, status, created_at, gender,
      profile:profiles(full_name, email, phone, avatar_url),
      memberships(start_date, end_date, status, plan:membership_plans(name))
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data: members } = await query;

  // Match name, email or phone. Phone matching ignores spaces, dashes, "+" etc.
  // so "70 123 456", "70123456" and "+961 70-123456" all find the same member.
  const qLower = q.toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const filtered = (members ?? []).filter((m: any) => {
    if (!q) return true;
    const name = m.profile?.full_name?.toLowerCase() ?? '';
    const email = m.profile?.email?.toLowerCase() ?? '';
    const phoneDigits = (m.profile?.phone ?? '').replace(/\D/g, '');
    return (
      name.includes(qLower) ||
      email.includes(qLower) ||
      (qDigits.length >= 3 && phoneDigits.includes(qDigits))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{filtered.length} member{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link href="/members/new" className="btn btn-primary" id="add-member-btn">
          <UserPlus size={16} />
          Add Member
        </Link>
      </div>

      {/* Filters */}
      <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
        <MemberSearch initialQuery={q} />
        <nav className="chip-row" aria-label="Filter by status">
          {STATUSES.map((s) => {
            const params = new URLSearchParams({ status: s });
            if (q) params.set('q', q);
            const active = statusRaw === s;
            return (
              <Link
                key={s}
                href={`/members?${params.toString()}`}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                aria-current={active ? 'page' : undefined}
                scroll={false}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            );
          })}
        </nav>
      </div>

      <MembersTable members={filtered} currentStatus={statusRaw} searchQuery={q} />
    </div>
  );
}
