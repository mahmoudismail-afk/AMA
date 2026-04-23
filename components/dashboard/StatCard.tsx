import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  change?: number;
  changeLabel?: string;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'var(--primary-light)',
  iconBg = 'var(--primary-glow)',
  change,
  changeLabel = 'vs last month',
  prefix = '',
  suffix = '',
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral  = change === 0;

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
          <Icon size={22} />
        </div>
      </div>

      {change !== undefined && (
        <div className={`stat-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {isPositive && <TrendingUp size={13} />}
          {isNegative && <TrendingDown size={13} />}
          {isNeutral  && <Minus size={13} />}
          <span>
            {isPositive ? '+' : ''}{change}% {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
