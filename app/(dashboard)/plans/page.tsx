import { createClient } from '@/lib/supabase/server';
import PlansClient from '@/components/plans/PlansClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Membership Plans' };

export default async function PlansPage() {
  await requirePermission('plans');
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('membership_plans')
    .select('*')
    .order('price');

  return (
    <div>
      <PlansClient plans={plans ?? []} />
    </div>
  );
}
