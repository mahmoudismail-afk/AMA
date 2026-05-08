'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
};

const BAR_COLORS = ['#6c63ff', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface HistoryClientProps {
  year: number;
  revenueData: { month: string; revenue: number }[];
  memberGrowthData: { month: string; members: number }[];
  genderData: { month: string; male: number; female: number }[];
  planDistData: { name: string; value: number }[];
  renewalsData: { month: string; renewals: number }[];
}

export default function HistoryClient({
  year, revenueData, memberGrowthData, genderData, planDistData, renewalsData,
}: HistoryClientProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Revenue — full width */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="chart-card-title">Monthly Revenue — {year}</p>
            <p className="chart-card-subtitle">Total income collected each month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={2.5}
              fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#6c63ff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 2-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* New Members */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-card-title">New Members — {year}</p>
              <p className="chart-card-subtitle">Members who joined each month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={memberGrowthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [val, 'New Members']}
                cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
              <Bar dataKey="members" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriptions started */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-card-title">Subscriptions Started — {year}</p>
              <p className="chart-card-subtitle">New & renewed memberships per month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={renewalsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [val, 'Subscriptions']}
                cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
              <Bar dataKey="renewals" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-card-title">Gender Breakdown — {year}</p>
              <p className="chart-card-subtitle">New members by gender per month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={genderData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
              <Legend formatter={v => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', textTransform: 'capitalize' }}>{v}</span>
              )} />
              <Bar dataKey="male"   stackId="a" fill="#06b6d4" />
              <Bar dataKey="female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-card-title">Plan Distribution — {year}</p>
              <p className="chart-card-subtitle">Memberships started by plan type</p>
            </div>
          </div>
          {planDistData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No membership data for this year</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={planDistData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [val, 'Members']}
                  cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {planDistData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
