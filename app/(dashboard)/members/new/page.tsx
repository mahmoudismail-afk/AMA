import { createClient } from '@/lib/supabase/server';
import MemberForm from '@/components/members/MemberForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Add Member' };

export default async function NewMemberPage() {
  const supabase = await createClient();
  const [{ data: plans }, { data: rateSetting }] = await Promise.all([
    supabase.from('membership_plans').select('id, name, price, duration_days').eq('is_active', true).order('price'),
    supabase.from('system_settings').select('value').eq('key', 'lbp_rate').single(),
  ]);
  const lbpRate = rateSetting ? Number(rateSetting.value) || 90000 : 90000;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Member</h1>
          <p className="page-subtitle">Create a new gym member account</p>
        </div>
      </div>
      <MemberForm plans={plans ?? []} lbpRate={lbpRate} />
    </div>
  );
}
