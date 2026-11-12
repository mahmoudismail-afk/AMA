'use client';


interface CurrencyInputProps {
  /** USD value (always stored/passed in USD) */
  valueUsd: number | string;
  onChange: (usdValue: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  // kept for backwards compat so callers don't break, but unused
  lbpRate?: number;
}

export default function CurrencyInput({
  valueUsd,
  onChange,
  disabled = false,
  placeholder = '0.00',
  id,
}: CurrencyInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{
        padding: '0 0.75rem',
        fontSize: '0.8125rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        alignSelf: 'stretch',
      }}>
        $
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        className="form-input"
        value={valueUsd}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        style={{ flex: 1 }}
      />
    </div>
  );
}
