'use server';

import { revalidatePath } from 'next/cache';
import { requireActionPermission, getServiceClient, AuthError } from '@/lib/auth/guards';
import { todayInGymTz } from '@/lib/utils';

const VALID_TYPES = ['expense', 'salary'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function authFail(err: unknown) {
  if (err instanceof AuthError) return { error: 'Not authorized' };
  throw err;
}

export async function saveExpense(data: {
  id?: string;
  type: 'expense' | 'salary';
  title: string;
  amount: number;
  date: string;
  notes?: string | null;
  is_recurring?: boolean;
}): Promise<{ data?: any; error?: string }> {
  try { await requireActionPermission('expenses'); } catch (e) { return authFail(e); }

  if (!VALID_TYPES.includes(data?.type)) return { error: 'Invalid entry type.' };
  const title = String(data?.title ?? '').trim();
  if (!title) return { error: 'Title is required.' };
  if (typeof data?.amount !== 'number' || !Number.isFinite(data.amount) || data.amount <= 0) {
    return { error: 'Please enter a valid amount.' };
  }
  const date = String(data?.date ?? '').trim();
  if (!DATE_RE.test(date)) return { error: 'Valid date is required.' };

  const payload = {
    type: data.type,
    title,
    amount: data.amount,
    date,
    notes: data.notes ? String(data.notes).trim() || null : null,
    is_recurring: data.type === 'salary' ? Boolean(data.is_recurring) : false,
  };

  const supabase = getServiceClient();
  const query = data.id
    ? supabase.from('expenses').update(payload).eq('id', data.id).select().single()
    : supabase.from('expenses').insert(payload).select().single();

  const { data: row, error } = await query;
  if (error) return { error: error.message };

  revalidatePath('/expenses');
  return { data: row };
}

export async function deleteExpense(id: string): Promise<{ success?: boolean; error?: string }> {
  try { await requireActionPermission('expenses'); } catch (e) { return authFail(e); }
  if (!id || typeof id !== 'string') return { error: 'Invalid expense ID.' };

  const supabase = getServiceClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/expenses');
  return { success: true };
}

export async function postRecurringSalaries(): Promise<{ added?: any[]; error?: string }> {
  try { await requireActionPermission('expenses'); } catch (e) { return authFail(e); }

  const supabase = getServiceClient();
  const today = todayInGymTz();
  const currentMonthPrefix = today.slice(0, 7);

  const { data: recurringSalaries, error: fetchErr } = await supabase
    .from('expenses')
    .select('title, amount, notes, date')
    .eq('type', 'salary')
    .eq('is_recurring', true)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (fetchErr) return { error: fetchErr.message };

  const { data: monthEntries, error: monthErr } = await supabase
    .from('expenses')
    .select('title')
    .gte('date', `${currentMonthPrefix}-01`)
    .lte('date', `${currentMonthPrefix}-31`);

  if (monthErr) return { error: monthErr.message };

  const existingTitles = new Set((monthEntries ?? []).map((e) => e.title));
  const templatesByTitle = new Map<string, { title: string; amount: number; notes: string | null }>();

  for (const row of recurringSalaries ?? []) {
    if (!templatesByTitle.has(row.title)) {
      templatesByTitle.set(row.title, {
        title: row.title,
        amount: row.amount,
        notes: row.notes ?? null,
      });
    }
  }

  const toInsert = Array.from(templatesByTitle.values())
    .filter((t) => !existingTitles.has(t.title))
    .map((t) => ({
      type: 'salary' as const,
      title: t.title,
      amount: t.amount,
      date: today,
      notes: t.notes,
      is_recurring: true,
    }));

  if (toInsert.length === 0) {
    return { added: [] };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('expenses')
    .insert(toInsert)
    .select();

  if (insertErr) return { error: insertErr.message };

  revalidatePath('/expenses');
  return { added: inserted ?? [] };
}
