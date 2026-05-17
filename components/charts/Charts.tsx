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

/* ── Plan Distribution Bar Chart ── */
const BAR_COLORS = ['#6c63ff', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface PlanDistributionChartProps {
  data: { name: string; value: number }[];
}
export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: number) => [val, 'Members']}
          cursor={{ fill: 'rgba(108,99,255,0.08)' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Today's Revenue — Hourly Bar Chart ── */
interface DailyRevenueChartProps {
  data: { hour: string; revenue: number }[];
}
export function DailyRevenueChart({ data }: DailyRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
          cursor={{ fill: 'rgba(6,182,212,0.08)' }}
        />
        <Bar dataKey="revenue" fill="url(#dailyGrad)" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Gender Breakdown — Stacked Bar Chart (per month) ── */
interface GenderBreakdownChartProps {
  data: { month: string; male: number; female: number }[];
}
export function GenderBreakdownChart({ data }: GenderBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: number, name: string) => [val, name === 'male' ? '♂ Male' : '♀ Female']}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Legend
          formatter={(v) => (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              {v === 'male' ? '♂ Male' : '♀ Female'}
            </span>
          )}
        />
        <Bar dataKey="male"   stackId="g" fill="#06b6d4" maxBarSize={40} />
        <Bar dataKey="female" stackId="g" fill="#f472b6" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}


