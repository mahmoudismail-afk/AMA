import { createClient } from '@/lib/supabase/server';
import { Users, DollarSign, Activity } from 'lucide-react';
import { formatCurrency, getLastNMonths } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const months = getLastNMonths(6);
  try {
    const supabase = await createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      { count: totalMembers },
      { count: activeMembers },
      { count: newThisMonth },
      { data: payments },
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('members').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('payments')
        .select('amount, payment_date')
        .gte('payment_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]),
    ]);

    // Monthly revenue — aggregate per month
    const revenueByMonth: Record<string, number> = {};
    months.forEach((m) => (revenueByMonth[m] = 0));
    (payments ?? []).forEach((p) => {
      const m = new Date(p.payment_date).toLocaleString('en-US', { month: 'short' });
      if (revenueByMonth[m] !== undefined) revenueByMonth[m] += Number(p.amount);
    });

    const revenueData = months.map((month) => ({ month, revenue: revenueByMonth[month] }));
    const monthlyRevenue = revenueByMonth[months[months.length - 1]] ?? 0;

    // New members per month (last 6)
    const { data: membersByMonth } = await supabase
      .from('members')
      .select('created_at')
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
      .from('memberships')
      .select('plan:membership_plans(name)')
      .eq('status', 'active');

    const planMap: Record<string, number> = {};
    (membershipsWithPlan ?? []).forEach((ms: any) => {
      const name = ms.plan?.name ?? 'Unknown';
      planMap[name] = (planMap[name] ?? 0) + 1;
    });
    const planData = Object.entries(planMap).map(([name, value]) => ({ name, value }));

    // Gender breakdown per month (last 6)
    const { data: membersWithGender } = await supabase
      .from('members')
      .select('gender, created_at')
      .eq('status', 'active')
      .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString());

    const genderMonthMap: Record<string, { male: number; female: number }> = {};
    months.forEach((m) => (genderMonthMap[m] = { male: 0, female: 0 }));
    (membersWithGender ?? []).forEach((mb: any) => {
      const m = new Date(mb.created_at).toLocaleString('en-US', { month: 'short' });
      if (!genderMonthMap[m]) return;
      if (mb.gender === 'male') genderMonthMap[m].male++;
      else if (mb.gender === 'female') genderMonthMap[m].female++;
    });
    const genderData = months.map((month) => ({ month, ...genderMonthMap[month] }));

    return {
      stats: {
        totalMembers: totalMembers ?? 0,
        activeMembers: activeMembers ?? 0,
        newThisMonth: newThisMonth ?? 0,
        monthlyRevenue,
      },
      revenueData,
      memberGrowthData,
      planData,
      genderData,
    };
  } catch (error) {
    console.error('Error fetching dashboard data during build:', error);
    return {
      stats: {
        totalMembers: 0,
        activeMembers: 0,
        newThisMonth: 0,
        monthlyRevenue: 0,
      },
      revenueData: months.map((month) => ({ month, revenue: 0 })),
      memberGrowthData: months.map((month) => ({ month, members: 0 })),
      planData: [],
      genderData: months.map((month) => ({ month, male: 0, female: 0, other: 0 })),
    };
  }
}

export default async function DashboardPage() {
  const { stats, revenueData, memberGrowthData, planData, genderData } = await getDashboardData();

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here&apos;s what&apos;s happening today</p>
        </div>
        <div className="badge badge-success" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
          <Activity size={14} /> Live
        </div>
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
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={Users}
          iconColor="#10b981"
          iconBg="rgba(16,185,129,0.15)"
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.15)"
        />
        <StatCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={Users}
          iconColor="#ec4899"
          iconBg="rgba(236,72,153,0.15)"
        />
      </div>

      {/* Charts row */}
      <DashboardCharts
        revenueData={revenueData}
        memberGrowthData={memberGrowthData}
        planData={planData}
        genderData={genderData}
      />

    </div>
  );
}
