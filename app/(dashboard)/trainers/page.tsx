import { createClient } from '@/lib/supabase/server';
import TrainersClient from '@/components/trainers/TrainersClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Trainers' };

export default async function TrainersPage() {
  await requirePermission('trainers');
  const supabase = await createClient();
  const { data: trainers } = await supabase
    .from('trainers')
    .select('*, profile:profiles(full_name, phone, avatar_url)')
    .order('created_at');

  return <TrainersClient trainers={trainers ?? []} />;
}
