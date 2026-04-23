import { createClient } from '@/lib/supabase/server';
import MemberForm from '@/components/members/MemberForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Add Member' };

export default async function NewMemberPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from('membership_plans')
    .select('id, name, price, duration_days')
    .eq('is_active', true)
    .order('price');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Member</h1>
          <p className="page-subtitle">Create a new gym member account</p>
        </div>
      </div>
      <MemberForm plans={plans ?? []} />
    </div>
  );
}
