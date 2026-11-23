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

const DEFAULT_STAFF_PERMISSIONS = ['dashboard', 'members', 'checkins', 'classes'];

/** Any signed-in admin or staff user. */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== 'admin' && ctx.role !== 'staff')) throw new AuthError();
  return ctx;
}

/** Signed-in admin, or staff user whose staff_permissions includes `permissionKey`. */
export async function requireActionPermission(permissionKey: string): Promise<AuthContext> {
  const ctx = await requireStaff();
  if (ctx.role === 'admin') return ctx;

  const { data } = await getServiceClient()
    .from('system_settings')
    .select('value')
    .eq('key', 'staff_permissions')
    .single();

  let val = data?.value;
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      val = undefined;
    }
  }

  const perms = Array.isArray(val) ? val : DEFAULT_STAFF_PERMISSIONS;
  if (!perms.includes(permissionKey)) throw new AuthError();
  return ctx;
}

/** Admins only. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== 'admin') throw new AuthError();
  return ctx;
}
