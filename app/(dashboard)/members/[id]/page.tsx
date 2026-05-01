import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Edit, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import MemberDetailClient from '@/components/members/MemberDetailClient';

export const metadata: Metadata = { title: 'Member Profile' };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: member }, { data: plans }] = await Promise.all([
    supabase
      .from('members')
      .select(`
        *, profile:profiles(full_name, email, phone, avatar_url),
        memberships(*, plan:membership_plans(name, price, duration_days)),
        payments(id, amount, payment_method, payment_date, notes),
        check_ins(id, checked_in_at)
      `)
      .eq('id', id)
      .single(),
    supabase.from('membership_plans').select('*').eq('is_active', true).order('price'),
  ]);

  if (!member) notFound();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/members" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Member Profile</h1>
            <p className="page-subtitle">Full details and history</p>
          </div>
        </div>
        <Link href={`/members/${id}/edit`} className="btn btn-secondary" id="edit-member-btn">
          <Edit size={16} /> Edit Member
        </Link>
      </div>

      <MemberDetailClient member={member} plans={plans ?? []} />
    </div>
  );
}
