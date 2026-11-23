'use server';

import { revalidatePath } from 'next/cache';
import { requireActionPermission, getServiceClient, AuthError } from '@/lib/auth/guards';

function authFail(err: unknown) {
  if (err instanceof AuthError) return { error: 'Not authorized' };
  throw err;
}

export async function savePlan(data: {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
}): Promise<{ data?: any; error?: string }> {
  try { await requireActionPermission('plans'); } catch (e) { return authFail(e); }

  const name = String(data?.name ?? '').trim();
  if (!name) return { error: 'Plan name is required.' };
  if (typeof data?.price !== 'number' || !Number.isFinite(data.price) || data.price < 0) {
    return { error: 'Please enter a valid price.' };
  }
  if (typeof data?.duration_days !== 'number' || !Number.isInteger(data.duration_days) || data.duration_days < 1) {
    return { error: 'Duration must be at least 1 day.' };
  }

  const features = Array.isArray(data.features)
    ? data.features.map((f) => String(f).trim()).filter(Boolean)
    : [];

  const payload = {
    name,
    description: data.description ? String(data.description).trim() || null : null,
    price: data.price,
    duration_days: data.duration_days,
    features,
    is_active: Boolean(data.is_active),
  };

  const supabase = getServiceClient();
  const query = data.id
    ? supabase.from('membership_plans').update(payload).eq('id', data.id).select().single()
    : supabase.from('membership_plans').insert(payload).select().single();

  const { data: row, error } = await query;
  if (error) return { error: error.message };

  revalidatePath('/plans');
  return { data: row };
}

export async function deletePlan(id: string): Promise<{ success?: boolean; error?: string }> {
  try { await requireActionPermission('plans'); } catch (e) { return authFail(e); }
  if (!id || typeof id !== 'string') return { error: 'Invalid plan ID.' };

  const supabase = getServiceClient();
  const { error } = await supabase.from('membership_plans').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/plans');
  return { success: true };
}
