'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Uses service role to bypass RLS — runs only on the server
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function createMember(formData: {
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  joined_at?: string;
  notes?: string;
  status: string;
  plan_id?: string;
  custom_price?: number;
}) {
  const supabase = getAdminClient();

  // 1. Create profile directly — no auth account needed
  const profileId = crypto.randomUUID();
  const { error: profileError } = await supabase.from('profiles').insert({
    id: profileId,
    full_name: formData.full_name,
    phone: formData.phone || null,
    email: formData.email || '',
    role: 'member',
  });

  if (profileError) return { error: profileError.message };

  // 2. Create member record
  const { data: newMember, error: memberError } = await supabase
    .from('members')
    .insert({
      profile_id: profileId,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      notes: formData.notes || null,
      status: formData.status,
      ...(formData.joined_at ? { created_at: new Date(formData.joined_at).toISOString() } : {}),
    })
    .select()
    .single();

  if (memberError) return { error: memberError.message };

  // 3. Assign plan + record payment if selected
  if (formData.plan_id && newMember) {
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('price, duration_days, name')
      .eq('id', formData.plan_id)
      .single();

    if (plan) {
      // Use joined_at as start date if provided, otherwise today
      const start = formData.joined_at ? new Date(formData.joined_at) : new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + plan.duration_days);

      await supabase.from('memberships').insert({
        member_id: newMember.id,
        plan_id: formData.plan_id,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'active',
      });

      const paymentAmount = formData.custom_price !== undefined ? formData.custom_price : plan.price;

      await supabase.from('payments').insert({
        member_id: newMember.id,
        amount: paymentAmount,
        payment_method: 'cash',
        payment_date: start.toISOString().split('T')[0],
        notes: `Initial plan: ${plan.name}`,
      });
    }
  }

  revalidatePath('/members');
  return { success: true, memberId: newMember.id };
}

export async function updateMember(
  memberId: string,
  profileId: string,
  formData: {
    full_name: string;
    phone: string;
    date_of_birth?: string;
    gender?: string;
    notes?: string;
    status: string;
  }
) {
  const supabase = getAdminClient();

  await supabase.from('profiles').update({
    full_name: formData.full_name,
    phone: formData.phone || null,
  }).eq('id', profileId);

  const { error } = await supabase.from('members').update({
    date_of_birth: formData.date_of_birth || null,
    gender: formData.gender || null,
    notes: formData.notes || null,
    status: formData.status,
  }).eq('id', memberId);

  if (error) return { error: error.message };

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}
