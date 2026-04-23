'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function createTrainer(data: {
  full_name: string;
  phone?: string;
  bio?: string;
  certifications: string[];
  specialties: string[];
  is_active: boolean;
}) {
  const supabase = getAdminClient();

  const profileId = crypto.randomUUID();
  const { error: profileError } = await supabase.from('profiles').insert({
    id: profileId,
    full_name: data.full_name,
    phone: data.phone || null,
    email: '',
    role: 'staff',
  });

  if (profileError) return { error: profileError.message };

  const { data: trainer, error } = await supabase
    .from('trainers')
    .insert({
      profile_id: profileId,
      bio: data.bio || null,
      certifications: data.certifications,
      specialties: data.specialties,
      is_active: data.is_active,
    })
    .select('*, profile:profiles(full_name, phone, avatar_url)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/trainers');
  return { success: true, trainer };
}

export async function updateTrainer(
  id: string,
  profileId: string,
  data: {
    full_name: string;
    phone?: string;
    bio?: string;
    certifications: string[];
    specialties: string[];
    is_active: boolean;
  }
) {
  const supabase = getAdminClient();

  await supabase.from('profiles').update({
    full_name: data.full_name,
    phone: data.phone || null,
  }).eq('id', profileId);

  const { error } = await supabase.from('trainers').update({
    bio: data.bio || null,
    certifications: data.certifications,
    specialties: data.specialties,
    is_active: data.is_active,
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/trainers');
  return { success: true };
}

export async function deleteTrainer(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from('trainers').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/trainers');
  return { success: true };
}
