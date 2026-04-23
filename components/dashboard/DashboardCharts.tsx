'use client';

import { RevenueChart, MemberGrowthChart, PlanDistributionChart } from '@/components/charts/Charts';

interface DashboardChartsProps {
  revenueData: { month: string; revenue: number }[];
  memberGrowthData: { month: string; members: number }[];
  planData: { name: string; value: number }[];
}

export default function DashboardCharts({ revenueData, memberGrowthData, planData }: DashboardChartsProps) {
  return (
    <div className="dashboard-grid">
      {/* Revenue chart — full width */}
      <div className="chart-card dashboard-grid-full">
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Revenue Overview</p>
            <p className="chart-card-subtitle">Monthly revenue for the last 6 months</p>
          </div>
        </div>
        <RevenueChart data={revenueData} />
      </div>

      {/* Member growth */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Member Growth</p>
            <p className="chart-card-subtitle">New members per month</p>
          </div>
        </div>
        <MemberGrowthChart data={memberGrowthData} />
      </div>

      {/* Plan distribution */}
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
  );
}
