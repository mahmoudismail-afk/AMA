import { createClient } from '@/lib/supabase/server';
import PaymentsClient from '@/components/payments/PaymentsClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  await requirePermission('payments');
  const supabase = await createClient();

  const [{ data: payments }, { data: members }] = await Promise.all([
    supabase.from('payments')
      .select('*, member:members(profile:profiles(full_name))')
      .order('payment_date', { ascending: false })
      .limit(200),
    supabase.from('members')
      .select('id, profile:profiles(full_name)')
      .eq('status', 'active'),
  ]);

  return <PaymentsClient payments={payments ?? []} members={members ?? []} />;
}
