'use server';

import { requireAdmin, requireStaff, getServiceClient, AuthError } from '@/lib/auth/guards';

const ALLOWED_ROLES = ['staff', 'admin'] as const;
const ALLOWED_PERMISSIONS = ['dashboard', 'members', 'payments', 'plans', 'expenses', 'history', 'inventory', 'settings', 'checkins', 'classes'];
const DEFAULT_PERMISSIONS = ['dashboard', 'members', 'checkins', 'classes'];

type ActionResult = { success?: boolean; error?: string };

function authFail(err: unknown): ActionResult {
  if (err instanceof AuthError) return { error: 'Not authorized' };
  throw err;
}

export async function createStaffAccount(data: {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'staff' | 'admin';
}): Promise<ActionResult> {
  try { await requireAdmin(); } catch (e) { return authFail(e); }

  // Server-side validation (client types are not enforced at runtime)
  const username = String(data?.username ?? '').trim();
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) return { error: 'Invalid username' };
  if (typeof data.password !== 'string' || data.password.length < 8) return { error: 'Password must be at least 8 characters' };
  if (!ALLOWED_ROLES.includes(data.role)) return { error: 'Invalid role' };

  const supabaseAdmin = getServiceClient();
  const email = `${username}@amagym.local`;

  // Role is NOT put in user_metadata (users can edit their own metadata). profiles.role is the source of truth.
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: String(data.fullName ?? ''), phone: String(data.phone ?? '') },
  });

  if (createError) return { error: createError.message };

  if (user.user) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: data.role, full_name: String(data.fullName ?? ''), phone: String(data.phone ?? '') })
      .eq('auth_id', user.user.id);
    if (error) return { error: error.message };
  }

  return { success: true };
}

// authId is no longer trusted from the client; it is looked up from the profile.
export async function deleteUser(profileId: string, _authId?: string | null): Promise<ActionResult> {
  let ctx;
  try { ctx = await requireAdmin(); } catch (e) { return authFail(e); }
  if (!profileId || typeof profileId !== 'string') return { error: 'No profile ID provided' };
  if (profileId === ctx.profileId) return { error: 'You cannot delete your own account' };

  const supabaseAdmin = getServiceClient();

  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('id, auth_id, role')
    .eq('id', profileId)
    .single();
  if (!target) return { error: 'User not found' };
  if (target.role !== 'admin' && target.role !== 'staff') return { error: 'Only staff/admin accounts can be deleted here' };

  const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', profileId);
  if (profileError) return { error: `Profile deletion failed: ${profileError.message}` };

  if (target.auth_id) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(target.auth_id);
    // If the auth user was already deleted from the dashboard, ignore the "User not found" error
    if (error && !error.message.toLowerCase().includes('user not found')) {
      return { error: `Auth deletion failed: ${error.message}` };
    }
  }

  return { success: true };
}

export async function updateProfile(profileId: string, data: { full_name: string; phone: string }): Promise<ActionResult> {
  let ctx;
  try { ctx = await requireStaff(); } catch (e) { return authFail(e); }
  // Users may edit their own profile; admins may edit anyone's.
  if (profileId !== ctx.profileId && ctx.role !== 'admin') return { error: 'Not authorized' };

  const supabaseAdmin = getServiceClient();
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: String(data?.full_name ?? ''), phone: String(data?.phone ?? '') })
    .eq('id', profileId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getStaffPermissions(): Promise<string[]> {
  try { await requireStaff(); } catch { return []; }

  const supabaseAdmin = getServiceClient();
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', 'staff_permissions')
    .single();

  let val = data?.value;
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch (e) {
      // ignore
    }
  }

  return Array.isArray(val) ? val : DEFAULT_PERMISSIONS;
}

export async function saveStaffPermissions(permissions: string[]): Promise<ActionResult> {
  try { await requireAdmin(); } catch (e) { return authFail(e); }
  if (!Array.isArray(permissions)) return { error: 'Invalid permissions' };
  const clean = permissions.filter((p) => typeof p === 'string' && ALLOWED_PERMISSIONS.includes(p));

  const supabaseAdmin = getServiceClient();
  const { error } = await supabaseAdmin
    .from('system_settings')
    .upsert({ key: 'staff_permissions', value: clean });
  if (error) return { error: error.message };
  return { success: true };
}
