import { createClient } from '@/lib/supabase/server';
import { Receipt } from 'lucide-react';
import ExpensesClient from '@/components/expenses/ExpensesClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Expenses' };
export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  await requirePermission('expenses');

  const supabase = await createClient();
  let expenses: any[] = [];
  let lbpRate = 90000;
  try {
    const [{ data, error }, { data: rateSetting }] = await Promise.all([
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('system_settings').select('value').eq('key', 'lbp_rate').single(),
    ]);
    if (!error) expenses = data ?? [];
    if (rateSetting) lbpRate = Number(rateSetting.value) || 90000;
  } catch {
    // table not yet created
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Receipt size={22} style={{ color: 'var(--primary-light)' }} /> Expenses
          </h1>
          <p className="page-subtitle">Track gym expenses and staff salaries</p>
        </div>
      </div>

      <ExpensesClient initialExpenses={expenses ?? []} lbpRate={lbpRate} />
    </div>
  );
}
