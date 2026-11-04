import 'server-only';

import { createClient as createSessionClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'staff' | 'member';

export interface AuthContext {
  authId: string;
  profileId: string;
  role: AppRole;
}

export class AuthError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Service-role client. Bypasses RLS — ONLY use it AFTER one of the
 * require*() guards below has verified the caller.
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials are not configured');
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Verifies the session with the Supabase Auth server (getUser(), not getSession())
 * and loads the role from public.profiles. Never trusts user_metadata.
 */
async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSessionClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await getServiceClient()
    .from('profiles')
    .select('id, role')
    .eq('auth_id', user.id)
    .single();

  if (!profile) return null;
  return { authId: user.id, profileId: profile.id, role: profile.role as AppRole };
}

/** Any signed-in admin or staff user. */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== 'admin' && ctx.role !== 'staff')) throw new AuthError();
  return ctx;
}

/** Admins only. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== 'admin') throw new AuthError();
  return ctx;
}
