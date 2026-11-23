'use server';

import { revalidatePath } from 'next/cache';
import { requireActionPermission, getServiceClient } from '@/lib/auth/guards';
import { todayInGymTz } from '@/lib/utils';

const NOT_AUTHORIZED = { error: 'Not authorized' } as const;

const VALID_MEMBER_STATUSES = ['active', 'inactive', 'paused', 'expired'] as const;
const VALID_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
const VALID_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other'] as const;

// Verifies the caller has the 'members' permission, THEN returns the service-role client (bypasses RLS).
// Returns null if the caller is not authorized.
async function getAuthorizedClient() {
  try {
    await requireActionPermission('members');
  } catch {
    return null;
  }
  return getServiceClient();
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
  const supabase = await getAuthorizedClient();
  if (!supabase) return NOT_AUTHORIZED;

  const fullName = String(formData?.full_name ?? '').trim();
  if (!fullName) return { error: 'Full name is required' };
  if (!VALID_MEMBER_STATUSES.includes(formData.status as (typeof VALID_MEMBER_STATUSES)[number])) {
    return { error: 'Invalid member status' };
  }
  if (formData.gender && !VALID_GENDERS.includes(formData.gender as (typeof VALID_GENDERS)[number])) {
    return { error: 'Invalid gender' };
  }
  if (
    formData.custom_price !== undefined &&
    (typeof formData.custom_price !== 'number' || !Number.isFinite(formData.custom_price) || formData.custom_price < 0)
  ) {
    return { error: 'Invalid payment amount' };
  }

  // 1. Create profile directly — no auth account needed
  const profileId = crypto.randomUUID();
  const { error: profileError } = await supabase.from('profiles').insert({
    id: profileId,
    full_name: fullName,
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
  _profileId: string,
  formData: {
    full_name: string;
    phone: string;
    date_of_birth?: string;
    gender?: string;
    notes?: string;
    status: string;
  }
) {
  const supabase = await getAuthorizedClient();
  if (!supabase) return NOT_AUTHORIZED;

  const fullName = String(formData?.full_name ?? '').trim();
  if (!fullName) return { error: 'Full name is required' };
  if (!VALID_MEMBER_STATUSES.includes(formData.status as (typeof VALID_MEMBER_STATUSES)[number])) {
    return { error: 'Invalid member status' };
  }
  if (formData.gender && !VALID_GENDERS.includes(formData.gender as (typeof VALID_GENDERS)[number])) {
    return { error: 'Invalid gender' };
  }

  // Look up profile_id and existing notes on the server (never trust client-supplied profileId)
  const { data: existingMember, error: fetchErr } = await supabase
    .from('members')
    .select('id, profile_id, status, notes')
    .eq('id', memberId)
    .single();
  if (fetchErr || !existingMember) return { error: 'Member not found' };

  // Strip any client-supplied [PAUSED:...] tag and preserve the server's tag if still paused
  const cleanedInputNotes = (formData.notes ?? '').replace(/\[PAUSED:[^\]]*\]/g, '').trim();
  const existingPauseTag = existingMember.notes?.match(/\[PAUSED:\d{4}-\d{2}-\d{2},\d+\]/)?.[0];
  let finalNotes: string | null = cleanedInputNotes || null;
  if (formData.status === 'paused' && existingPauseTag) {
    finalNotes = cleanedInputNotes ? `${cleanedInputNotes} ${existingPauseTag}` : existingPauseTag;
  }

  if (existingMember.profile_id) {
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: formData.phone || null,
      })
      .eq('id', existingMember.profile_id)
      .eq('role', 'member');
    if (profileErr) return { error: profileErr.message };
  }

  const { error } = await supabase.from('members').update({
    date_of_birth: formData.date_of_birth || null,
    gender: formData.gender || null,
    notes: finalNotes,
    status: formData.status,
  }).eq('id', memberId);

  if (error) return { error: error.message };

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function renewMembership(
  memberId: string,
  formData: {
    plan_id: string;
    start_date: string;
    record_payment: boolean;
    payment_method: string;
    custom_price?: number;
  }
) {
  const supabase = await getAuthorizedClient();
  if (!supabase) return NOT_AUTHORIZED;

  if (!VALID_PAYMENT_METHODS.includes(formData.payment_method as (typeof VALID_PAYMENT_METHODS)[number])) {
    return { error: 'Invalid payment method' };
  }
  if (
    formData.custom_price !== undefined &&
    (typeof formData.custom_price !== 'number' || !Number.isFinite(formData.custom_price) || formData.custom_price < 0)
  ) {
    return { error: 'Invalid payment amount' };
  }

  const { data: plan } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', formData.plan_id)
    .single();

  if (!plan) return { error: 'Plan not found' };

  const start = new Date(formData.start_date);
  const end = new Date(start);
  end.setDate(end.getDate() + plan.duration_days);

  // Expire old active memberships
  await supabase
    .from('memberships')
    .update({ status: 'expired' })
    .eq('member_id', memberId)
    .eq('status', 'active');

  // Create new membership
  const { error: mErr } = await supabase.from('memberships').insert({
    member_id: memberId,
    plan_id: formData.plan_id,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    status: 'active',
  });

  if (mErr) return { error: mErr.message };

  // Update member status
  await supabase.from('members').update({ status: 'active' }).eq('id', memberId);

  // Record payment
  if (formData.record_payment) {
    const paymentAmount = formData.custom_price !== undefined
      ? formData.custom_price
      : plan.price;
      
    await supabase.from('payments').insert({
      member_id: memberId,
      amount: paymentAmount,
      payment_method: formData.payment_method,
      payment_date: start.toISOString().split('T')[0],
      notes: `Subscription renewal — ${plan.name}`,
    });
  }

  revalidatePath(`/members/${memberId}`);
  revalidatePath('/members');
  return { success: true };
}

export async function pauseMembership(memberId: string) {
  const supabase = await getAuthorizedClient();
  if (!supabase) return NOT_AUTHORIZED;

  // Find the current active membership
  const { data: membership, error: msErr } = await supabase
    .from('memberships')
    .select('id, end_date')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .single();

  if (msErr || !membership) return { error: 'No active membership found to pause.' };

  const today = new Date();
  const endDate = new Date(membership.end_date);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Mark membership as paused and store the days remaining + paused date in the membership row
  const { error: updateMsErr } = await supabase
    .from('memberships')
    .update({
      status: 'paused',
      // Store pause metadata as a specially-prefixed string appended to the end_date field
      // We use a separate approach: store paused_at and days_left in the member's notes via a JSON tag
    })
    .eq('id', membership.id);

  if (updateMsErr) return { error: updateMsErr.message };

  // Store pause metadata in members.notes using a hidden JSON tag
  const { data: memberData } = await supabase
    .from('members')
    .select('notes')
    .eq('id', memberId)
    .single();

  const existingNotes = memberData?.notes ?? '';
  // Strip any old pause tag
  const cleanNotes = existingNotes.replace(/\[PAUSED:[^\]]*\]/g, '').trim();
  const pauseTag = `[PAUSED:${today.toISOString().split('T')[0]},${daysLeft}]`;
  const newNotes = cleanNotes ? `${cleanNotes} ${pauseTag}` : pauseTag;

  const { error: memberUpdateErr } = await supabase
    .from('members')
    .update({ status: 'paused', notes: newNotes })
    .eq('id', memberId);

  if (memberUpdateErr) return { error: memberUpdateErr.message };

  revalidatePath(`/members/${memberId}`);
  revalidatePath('/members');
  return { success: true, daysLeft };
}

export async function resumeMembership(memberId: string) {
  const supabase = await getAuthorizedClient();
  if (!supabase) return NOT_AUTHORIZED;

  // Get the paused membership
  const { data: membership, error: msErr } = await supabase
    .from('memberships')
    .select('id, end_date')
    .eq('member_id', memberId)
    .eq('status', 'paused')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (msErr || !membership) return { error: 'No paused membership found.' };

  // Get the member notes to extract pause metadata
  const { data: memberData } = await supabase
    .from('members')
    .select('notes')
    .eq('id', memberId)
    .single();

  const notes = memberData?.notes ?? '';
  const pauseMatch = notes.match(/\[PAUSED:(\d{4}-\d{2}-\d{2}),(\d+)\]/);

  if (!pauseMatch) return { error: 'Pause data not found. Please manually set a new end date.' };

  const pausedAtStr = pauseMatch[1];
  const parsedDaysLeft = parseInt(pauseMatch[2], 10);
  const daysLeftAtPause = Math.min(3650, Math.max(0, Number.isFinite(parsedDaysLeft) ? parsedDaysLeft : 0));

  // Calculate how many days have elapsed since the pause
  const today = new Date();
  const pausedAt = new Date(pausedAtStr);
  const daysPaused = Math.ceil((today.getTime() - pausedAt.getTime()) / (1000 * 60 * 60 * 24));

  // New end date = today + remaining days that were left when paused
  const newEndDate = new Date(today);
  newEndDate.setDate(newEndDate.getDate() + daysLeftAtPause);

  // Update the membership: restore to active with adjusted end_date
  const { error: updateMsErr } = await supabase
    .from('memberships')
    .update({
      status: 'active',
      end_date: newEndDate.toISOString().split('T')[0],
    })
    .eq('id', membership.id);

  if (updateMsErr) return { error: updateMsErr.message };

  // Clean the pause tag from notes and restore member status to active
  const cleanNotes = notes.replace(/\s*\[PAUSED:[^\]]*\]/g, '').trim();

  const { error: memberUpdateErr } = await supabase
    .from('members')
    .update({ status: 'active', notes: cleanNotes || null })
    .eq('id', memberId);

  if (memberUpdateErr) return { error: memberUpdateErr.message };

  revalidatePath(`/members/${memberId}`);
  revalidatePath('/members');
  return { success: true, daysLeft: daysLeftAtPause, daysPaused };
}

export async function deleteMember(memberId: string) {
  const supabase = await getAuthorizedClient();
  if (!supabase) return NOT_AUTHORIZED;
  if (!memberId || typeof memberId !== 'string') return { error: 'Invalid member ID' };

  const { data: member } = await supabase
    .from('members')
    .select('profile_id')
    .eq('id', memberId)
    .single();

  const { error } = await supabase.from('members').delete().eq('id', memberId);
  if (error) return { error: error.message };

  if (member?.profile_id) {
    await supabase
      .from('profiles')
      .delete()
      .eq('id', member.profile_id)
      .eq('role', 'member');
  }

  revalidatePath('/members');
  return { success: true };
}

/**
 * Server-side expiration using the gym timezone clock (Asia/Beirut).
 * Safe to invoke during Server Component render (does not call revalidatePath).
 */
export async function expireOverdueMemberships() {
  const supabase = await getAuthorizedClient();
  if (!supabase) return;

  const today = todayInGymTz();
  const { data: overdue } = await supabase
    .from('memberships')
    .select('id, member_id')
    .eq('status', 'active')
    .lt('end_date', today);

  if (!overdue || overdue.length === 0) return;

  const memberIds = Array.from(new Set(overdue.map((ms) => ms.member_id).filter(Boolean)));

  await supabase
    .from('memberships')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('end_date', today);

  if (memberIds.length > 0) {
    await supabase
      .from('members')
      .update({ status: 'expired' })
      .in('id', memberIds)
      .eq('status', 'active');
  }
}