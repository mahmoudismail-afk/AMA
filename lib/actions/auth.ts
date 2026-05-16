'use server';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

function getAdminClient() {
  dotenv.config({ path: '.env.local' });
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  );
}

export async function registerAdmin(data: { username: string; password: string; fullName: string; phone: string }) {
  try {
    const supabaseAdmin = getAdminClient();
    const emailToAuth = `${data.username.trim()}@salonraed.local`;

    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailToAuth,
      password: data.password,
      email_confirm: true, // This is the magic key that skips email confirmation
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone,
        role: 'admin',
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to create account.' };
  }
}
