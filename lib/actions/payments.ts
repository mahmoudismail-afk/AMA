'use server';

import { revalidatePath } from 'next/cache';
import { requireActionPermission, getServiceClient, AuthError } from '@/lib/auth/guards';

const VALID_METHODS = ['cash', 'card', 'bank_transfer', 'other'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function authFail(err: unknown) {
  if (err instanceof AuthError) return { error: 'Not authorized' };
  throw err;
}

export async function createPayment(data: {
  member_id?: string;
  payer_name?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string | null;
}): Promise<{ data?: any; error?: string }> {
  try { await requireActionPermission('payments'); } catch (e) { return authFail(e); }

  if (typeof data?.amount !== 'number' || !Number.isFinite(data.amount) || data.amount <= 0) {
    return { error: 'Please enter a valid positive amount.' };
  }
  if (!VALID_METHODS.includes(data?.payment_method as (typeof VALID_METHODS)[number])) {
    return { error: 'Invalid payment method.' };
  }
  const paymentDate = String(data?.payment_date ?? '').trim();
  if (!DATE_RE.test(paymentDate)) {
    return { error: 'Valid payment date is required.' };
  }

  let notesValue = data.notes ? String(data.notes).trim() || null : null;
  const payerName = String(data?.payer_name ?? '').trim();
  if (!data.member_id && payerName) {
    notesValue = notesValue ? `[Payer: ${payerName}] ${notesValue}` : `[Payer: ${payerName}]`;
  }

  const insertPayload: Record<string, unknown> = {
    amount: data.amount,
    payment_method: data.payment_method,
    payment_date: paymentDate,
    notes: notesValue,
  };
  if (data.member_id) insertPayload.member_id = data.member_id;

  const supabase = getServiceClient();
  const { data: row, error } = await supabase
    .from('payments')
    .insert(insertPayload)
    .select('*, member:members(profile:profiles(full_name))')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/payments');
  return { data: row };
}

export async function softDeletePayment(id: string): Promise<{ deletedAt?: string; error?: string }> {
  try { await requireActionPermission('payments'); } catch (e) { return authFail(e); }
  if (!id || typeof id !== 'string') return { error: 'Invalid payment ID.' };

  const deletedAt = new Date().toISOString();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: deletedAt })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/payments');
  return { deletedAt };
}

export async function restorePayment(id: string): Promise<{ success?: boolean; error?: string }> {
  try { await requireActionPermission('payments'); } catch (e) { return authFail(e); }
  if (!id || typeof id !== 'string') return { error: 'Invalid payment ID.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('payments')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/payments');
  return { success: true };
}
