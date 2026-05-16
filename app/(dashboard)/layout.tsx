import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import { getStaffPermissions } from '@/lib/actions/settings';
import './dashboard.css';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url, role')
    .eq('auth_id', user.id)
    .single();

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Admin';
  const displayEmail = (profile?.email?.includes('@amagym.local') || profile?.email?.includes('@salonraed.local')) ? '' : (profile?.email ?? '');
  const role: string = profile?.role ?? 'staff';
  const staffPermissions = await getStaffPermissions();

  return (
    <DashboardShell
      userName={displayName}
      userEmail={displayEmail}
      avatarUrl={profile?.avatar_url ?? undefined}
      role={role}
      staffPermissions={staffPermissions}
    >
      {children}
    </DashboardShell>
  );
}
