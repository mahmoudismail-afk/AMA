import { createClient } from '@/lib/supabase/server';
import CheckinsClient from '@/components/checkins/CheckinsClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Check-ins' };

export default async function CheckinsPage() {
  await requirePermission('checkins');
  const supabase = await createClient();

  const [{ data: checkIns }, { data: members }] = await Promise.all([
    supabase.from('check_ins')
      .select('*, member:members(profile:profiles(full_name, avatar_url))')
      .order('checked_in_at', { ascending: false })
      .limit(100),
    supabase.from('members')
      .select('id, profile:profiles(full_name)')
      .eq('status', 'active')
      .order('created_at'),
  ]);

  return <CheckinsClient checkIns={checkIns ?? []} members={members ?? []} />;
}
