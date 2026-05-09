import { createClient } from '@/lib/supabase/server';
import ReportsClient from '@/components/reports/ReportsClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reports & Analytics' };

export default async function ReportsPage() {
  await requirePermission('reports');
  const supabase = await createClient();

  const [
    { data: payments },
    { data: members },
    { data: memberships },
    { data: plans },
    { data: classSchedules },
    { data: classTypes },
    { data: checkins },
    { data: inventoryTxns },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('payments').select('amount, payment_date, payment_method').order('payment_date'),
    supabase.from('members').select('id, status, created_at'),
    supabase.from('memberships').select('plan_id, status, membership_plans(name)'),
    supabase.from('membership_plans').select('id, name'),
    supabase.from('class_schedules').select('id, class_type_id, status, start_time'),
    supabase.from('class_types').select('id, name, color'),
    supabase.from('check_ins').select('id, checked_in_at'),
    supabase.from('inventory_transactions').select('type, total_amount, created_at'),
    supabase.from('expenses').select('type, amount, date'),
  ]);

  return (
    <ReportsClient
      payments={payments ?? []}
      members={members ?? []}
      memberships={memberships ?? []}
      plans={plans ?? []}
      classSchedules={classSchedules ?? []}
      classTypes={classTypes ?? []}
      checkins={checkins ?? []}
      inventoryTxns={inventoryTxns ?? []}
      expenses={expenses ?? []}
    />
  );
}
