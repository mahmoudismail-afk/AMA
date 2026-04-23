import { createClient } from '@/lib/supabase/server';
import { Users, TrendingUp, Calendar, UserCheck, DollarSign, Activity } from 'lucide-react';
import { formatCurrency, formatDateTime, getInitials, getLastNMonths } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: newThisMonth },
    { count: checkInsToday },
    { count: classesToday },
    { data: recentCheckIns },
    { data: payments },
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('members').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('check_ins').select('*', { count: 'exact', head: true }).gte('checked_in_at', startOfToday),
    supabase.from('class_schedules').select('*', { count: 'exact', head: true })
      .gte('start_time', startOfToday).eq('status', 'scheduled'),
    supabase.from('check_ins')
      .select('id, checked_in_at, member:members(profile:profiles(full_name, avatar_url))')
      .order('checked_in_at', { ascending: false })
      .limit(8),
    supabase.from('payments')
      .select('amount, payment_date')
      .gte('payment_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]),
  ]);

  // Build revenue chart data
  const months = getLastNMonths(6);
  const revenueByMonth: Record<string, number> = {};
  months.forEach((m) => (revenueByMonth[m] = 0));
  (payments ?? []).forEach((p) => {
    const m = new Date(p.payment_date).toLocaleString('en-US', { month: 'short' });
    if (revenueByMonth[m] !== undefined) revenueByMonth[m] += Number(p.amount);
  });
  const revenueData = months.map((month) => ({ month, revenue: revenueByMonth[month] }));
  const monthlyRevenue = revenueByMonth[months[months.length - 1]] ?? 0;

  // Member growth per month
  const { data: membersByMonth } = await supabase
    .from('members').select('created_at')
    .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString());

  const memberGrowthMap: Record<string, number> = {};
  months.forEach((m) => (memberGrowthMap[m] = 0));
  (membersByMonth ?? []).forEach((mb) => {
    const m = new Date(mb.created_at).toLocaleString('en-US', { month: 'short' });
    if (memberGrowthMap[m] !== undefined) memberGrowthMap[m]++;
  });
  const memberGrowthData = months.map((month) => ({ month, members: memberGrowthMap[month] }));

  // Plan distribution
  const { data: membershipsWithPlan } = await supabase
    .from('memberships').select('plan:membership_plans(name)').eq('status', 'active');

  const planMap: Record<string, number> = {};
  (membershipsWithPlan ?? []).forEach((ms: any) => {
    const name = ms.plan?.name ?? 'Unknown';
    planMap[name] = (planMap[name] ?? 0) + 1;
  });
  const planData = Object.entries(planMap).map(([name, value]) => ({ name, value }));

  return {
    stats: {
      totalMembers: totalMembers ?? 0,
      activeMembers: activeMembers ?? 0,
      newThisMonth: newThisMonth ?? 0,
      checkInsToday: checkInsToday ?? 0,
      classesToday: classesToday ?? 0,
      monthlyRevenue,
    },
    recentCheckIns: recentCheckIns ?? [],
    revenueData,
    memberGrowthData,
    planData,
  };
}

export default async function DashboardPage() {
  await requirePermission('dashboard');
  const { stats, recentCheckIns, revenueData, memberGrowthData, planData } = await getDashboardData();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here&apos;s what&apos;s happening today</p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
          <Activity size={14} /> Live
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          iconColor="var(--primary-light)"
          iconBg="var(--primary-glow)"
          change={stats.newThisMonth}
          changeLabel="new this month"
        />
        <StatCard title="Active Members" value={stats.activeMembers}
          icon={UserCheck} iconColor="#10b981" iconBg="rgba(16,185,129,0.15)" />
        <StatCard title="Revenue This Month" value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.15)" />
        <StatCard title="Check-ins Today" value={stats.checkInsToday}
          icon={TrendingUp} iconColor="#06b6d4" iconBg="rgba(6,182,212,0.15)" />
        <StatCard title="Classes Today" value={stats.classesToday}
          icon={Calendar} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.15)" />
        <StatCard title="New This Month" value={stats.newThisMonth}
          icon={Users} iconColor="#ec4899" iconBg="rgba(236,72,153,0.15)" />
      </div>

      {/* Charts */}
      <DashboardCharts
        revenueData={revenueData}
        memberGrowthData={memberGrowthData}
        planData={planData}
      />

      {/* Recent Check-ins */}
      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Recent Check-ins</p>
            <p className="chart-card-subtitle">Latest member arrivals</p>
          </div>
          <a href="/checkins" className="btn btn-ghost btn-sm">View all</a>
        </div>

        {recentCheckIns.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
              <UserCheck size={22} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No check-ins yet</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentCheckIns.map((ci: any) => {
              const name = ci.member?.profile?.full_name ?? 'Unknown Member';
              const avatar = ci.member?.profile?.avatar_url;
              return (
                <div key={ci.id} className="activity-item">
                  <div className="avatar avatar-sm">
                    {avatar
                      ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(name)}
                  </div>
                  <div className="activity-meta">
                    <p className="activity-name">{name}</p>
                    <p className="activity-time">{formatDateTime(ci.checked_in_at)}</p>
                  </div>
                  <span className="badge badge-success activity-badge">Checked in</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
