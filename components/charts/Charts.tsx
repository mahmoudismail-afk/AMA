'use client';

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ── Shared tooltip style ── */
const tooltipStyle = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
};

/* ── Revenue Area Chart ── */
interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}
export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${v/1000}k` : v}`} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
        />
        <Area type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={2.5}
          fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#6c63ff' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Member Growth Bar Chart ── */
interface MemberGrowthChartProps {
  data: { month: string; members: number }[];
}
export function MemberGrowthChart({ data }: MemberGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: number) => [val, 'New Members']}
          cursor={{ fill: 'rgba(108,99,255,0.08)' }}
        />
        <Bar dataKey="members" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Plan Distribution Pie Chart ── */
const PIE_COLORS = ['#6c63ff', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface PlanDistributionChartProps {
  data: { name: string; value: number }[];
}
export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
          paddingAngle={3} dataKey="value">
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [val, 'Members']} />
        <Legend
          formatter={(value) => (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
