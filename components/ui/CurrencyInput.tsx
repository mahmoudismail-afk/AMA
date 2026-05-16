'use client';

import { useState } from 'react';
import { formatCurrency, formatLBP, lbpToUsd, usdToLbp } from '@/lib/utils';

interface CurrencyInputProps {
  /** USD value (always stored/passed in USD) */
  valueUsd: number | string;
  onChange: (usdValue: string) => void;
  lbpRate: number;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * Amount input that lets the user toggle between USD and LBP.
 * Always calls onChange with the equivalent USD amount as a string.
 */
export default function CurrencyInput({
  valueUsd,
  onChange,
  lbpRate,
  disabled = false,
  placeholder,
  id,
}: CurrencyInputProps) {
  const [currency, setCurrency] = useState<'USD' | 'LBP'>('USD');
  // raw display value in the selected currency
  const [raw, setRaw] = useState(valueUsd !== '' ? String(valueUsd) : '');

  const rate = lbpRate > 0 ? lbpRate : 90000;

  function handleCurrencyToggle(next: 'USD' | 'LBP') {
    if (next === currency) return;
    const currentNum = parseFloat(raw) || 0;
    if (next === 'LBP') {
      // convert existing USD value to LBP for display
      const inLBP = usdToLbp(currentNum, rate);
      const newRaw = inLBP > 0 ? Math.round(inLBP).toString() : '';
      setRaw(newRaw);
    } else {
      // convert existing LBP value back to USD
      const inUSD = lbpToUsd(currentNum, rate);
      const newRaw = inUSD > 0 ? inUSD.toFixed(2).replace(/\.00$/, '') : '';
      setRaw(newRaw);
      onChange(newRaw);
    }
    setCurrency(next);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setRaw(val);
    const num = parseFloat(val) || 0;
    if (currency === 'LBP') {
      onChange(lbpToUsd(num, rate).toFixed(2));
    } else {
      onChange(val);
    }
  }

  // Equivalent value for the "other" currency hint
  const numVal = parseFloat(raw) || 0;
  const equivalent = currency === 'USD'
    ? (numVal > 0 ? `≈ ${formatLBP(usdToLbp(numVal, rate))}` : null)
    : (numVal > 0 ? `≈ ${formatCurrency(lbpToUsd(numVal, rate))}` : null);

  return (
    <div>
      {/* Toggle + input row */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
        {/* Currency toggle pill */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {(['USD', 'LBP'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleCurrencyToggle(c)}
              disabled={disabled}
              style={{
                padding: '0 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.15s',
                background: currency === c ? 'var(--primary)' : 'transparent',
                color: currency === c ? '#fff' : 'var(--text-muted)',
                letterSpacing: '0.03em',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <input
          id={id}
          type="number"
          min="0"
          step={currency === 'LBP' ? '1000' : '0.01'}
          className="form-input"
          value={raw}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder ?? (currency === 'USD' ? '0.00' : '0')}
          style={{ flex: 1 }}
        />
      </div>

      {/* Equivalent hint */}
      {equivalent && (
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.3rem',
          letterSpacing: '0.01em',
        }}>
          {equivalent}
        </p>
      )}
    </div>
  );
}
