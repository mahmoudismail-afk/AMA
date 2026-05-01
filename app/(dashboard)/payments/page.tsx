import { createClient } from '@/lib/supabase/server';
import PaymentsClient from '@/components/payments/PaymentsClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payments' };
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  await requirePermission('payments');
  const supabase = await createClient();

  const [{ data: payments }, { data: deletedPayments }, { data: members }] = await Promise.all([
    supabase.from('payments')
      .select('*, member:members(profile:profiles(full_name))')
      .is('deleted_at', null)
      .order('payment_date', { ascending: false })
      .limit(200),
    supabase.from('payments')
      .select('*, member:members(profile:profiles(full_name))')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(200),
    supabase.from('members')
      .select('id, profile:profiles(full_name)')
      .eq('status', 'active'),
  ]);

  return <PaymentsClient payments={payments ?? []} deletedPayments={deletedPayments ?? []} members={members ?? []} />;
}
