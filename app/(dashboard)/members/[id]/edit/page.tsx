import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MemberForm from '@/components/members/MemberForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit Member' };

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [{ data: member }, { data: plans }] = await Promise.all([
    supabase.from('members').select('*, profile:profiles(*)').eq('id', params.id).single(),
    supabase.from('membership_plans').select('id, name, price, duration_days').eq('is_active', true).order('price'),
  ]);

  if (!member) notFound();

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href={`/members/${params.id}`} className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Edit Member</h1>
            <p className="page-subtitle">{member.profile?.full_name ?? 'Member'}</p>
          </div>
        </div>
      </div>
      <MemberForm
        plans={plans ?? []}
        member={member}
        profile={member.profile}
        isEdit
      />
    </div>
  );
}
