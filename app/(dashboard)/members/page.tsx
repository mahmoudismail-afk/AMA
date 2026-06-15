import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { UserPlus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import MembersTable from '@/components/members/MembersTable';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Members' };

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  await requirePermission('members');
  const supabase = await createClient();
  const q = resolvedSearchParams.q ?? '';
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

  // Filter by name/email client-side from the fetched data
  const filtered = (members ?? []).filter((m: any) => {
    if (!q) return true;
    const name = m.profile?.full_name?.toLowerCase() ?? '';
    const email = m.profile?.email?.toLowerCase() ?? '';
    return name.includes(q.toLowerCase()) || email.includes(q.toLowerCase());
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
        <form className="search-input-wrapper" action="/members" method="get">
          <Search size={16} className="search-icon" />
          <input
            name="q"
            type="search"
            className="search-input"
            placeholder="Search by name or email..."
            defaultValue={q}
            id="member-search"
          />
        </form>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'active', 'inactive', 'paused', 'expired'].map((s) => (
            <Link
              key={s}
              href={`/members?status=${s}${q ? `&q=${q}` : ''}`}
              className={`btn btn-sm ${statusRaw === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      <MembersTable members={filtered} currentStatus={statusRaw} />
    </div>
  );
}
