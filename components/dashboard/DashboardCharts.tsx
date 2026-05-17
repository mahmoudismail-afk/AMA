'use client';

import { RevenueChart, MemberGrowthChart, PlanDistributionChart, GenderBreakdownChart } from '@/components/charts/Charts';
import { formatCurrency } from '@/lib/utils';

interface DashboardChartsProps {
  revenueData:     { month: string; revenue: number }[];
  memberGrowthData: { month: string; members: number }[];
  planData:        { name: string; value: number }[];
  genderData:      { month: string; male: number; female: number }[];
}

export default function DashboardCharts({
  revenueData, memberGrowthData, planData, genderData,
}: DashboardChartsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

      {/* Gender Breakdown */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Gender Breakdown</p>
            <p className="chart-card-subtitle">New members gender per month</p>
          </div>
        </div>
        <GenderBreakdownChart data={genderData} />
      </div>

    </div>
  );
}
