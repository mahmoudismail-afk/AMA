import { createClient } from '@/lib/supabase/server';
import ClassesClient from '@/components/classes/ClassesClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Classes' };

export default async function ClassesPage() {
  await requirePermission('classes');
  const supabase = await createClient();

  const [{ data: schedules }, { data: classTypes }, { data: trainers }] = await Promise.all([
    supabase.from('class_schedules')
      .select('*, class_type:class_types(name, color), trainer:trainers(profile:profiles(full_name))')
      .order('start_time', { ascending: false })
      .limit(100),
    supabase.from('class_types').select('*').order('name'),
    supabase.from('trainers')
      .select('id, profile:profiles(full_name)')
      .eq('is_active', true),
  ]);

  return <ClassesClient schedules={schedules ?? []} classTypes={classTypes ?? []} trainers={trainers ?? []} />;
}
