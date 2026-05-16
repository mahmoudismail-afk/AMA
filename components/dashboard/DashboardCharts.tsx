'use client';

import { RevenueChart, MemberGrowthChart, PlanDistributionChart, WeeklyRevenueChart } from '@/components/charts/Charts';
import { formatCurrency, formatLBP, usdToLbp } from '@/lib/utils';

interface DashboardChartsProps {
  weeklyChartData: { day: string; revenue: number }[];
  weeklyRevenue:   number;
  lbpRate:         number;
  revenueData:     { month: string; revenue: number }[];
  memberGrowthData: { month: string; members: number }[];
  planData:        { name: string; value: number }[];
}

export default function DashboardCharts({
  weeklyChartData, weeklyRevenue, lbpRate,
  revenueData, memberGrowthData, planData,
}: DashboardChartsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* This Week's Revenue — full width */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Revenue This Week</p>
            <p className="chart-card-subtitle">Last 7 days</p>
          </div>
          <span style={{
            fontSize: '1.25rem', fontWeight: 700,
            color: '#8b5cf6', letterSpacing: '-0.5px',
          }}>
            {formatCurrency(weeklyRevenue)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {formatLBP(usdToLbp(weeklyRevenue, lbpRate))}
          </span>
        </div>
        <WeeklyRevenueChart data={weeklyChartData} />
      </div>

      {/* Monthly Revenue — full width */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Revenue Overview</p>
            <p className="chart-card-subtitle">Monthly revenue for the last 6 months</p>
          </div>
        </div>
        <RevenueChart data={revenueData} />
      </div>

      {/* Member Growth + Plan Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-card-title">Member Growth</p>
              <p className="chart-card-subtitle">New members per month</p>
            </div>
          </div>
          <MemberGrowthChart data={memberGrowthData} />
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-card-title">Plan Distribution</p>
              <p className="chart-card-subtitle">Active memberships by plan</p>
            </div>
          </div>
          {planData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No active memberships yet</p>
            </div>
          ) : (
            <PlanDistributionChart data={planData} />
          )}
        </div>
      </div>

    </div>
  );
}
