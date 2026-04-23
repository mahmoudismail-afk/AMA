import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getStaffPermissions } from '@/lib/actions/settings';

/**
 * Call at the top of any server page/layout to require a specific role.
 * Redirects to /dashboard with a reason query param if the user doesn't have access.
 */
export async function requireRole(requiredRole: 'admin' | 'staff') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  const role = profile?.role ?? 'staff';

  if (requiredRole === 'admin' && role !== 'admin') {
    redirect('/dashboard?access=denied');
  }

  return role;
}

/**
 * Call at the top of any server page to require a specific permission.
 * Admins always have all permissions. Staff are checked against the DB.
 */
export async function requirePermission(permissionKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  const role = profile?.role ?? 'staff';

  if (role === 'admin') return role;

  const staffPerms = await getStaffPermissions();
  if (!staffPerms.includes(permissionKey)) {
    redirect('/dashboard?access=denied');
  }

  return role;
}
