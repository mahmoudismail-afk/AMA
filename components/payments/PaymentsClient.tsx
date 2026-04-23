'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, DollarSign, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

const METHODS = ['cash', 'card', 'bank_transfer', 'other'];

export default function PaymentsClient({ payments: initial, members }: { payments: any[]; members: any[] }) {
  const router = useRouter();
  const [payments, setPayments] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    member_id: '', amount: '', payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredMembers = members.filter((m) =>
    (m.profile?.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    if (!form.member_id || !form.amount) { setError('Member and amount are required.'); return; }
    setError(''); setSaving(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.from('payments').insert({
      member_id: form.member_id, amount: Number(form.amount),
      payment_method: form.payment_method, payment_date: form.payment_date,
      notes: form.notes || null,
    }).select('*, member:members(profile:profiles(full_name))').single();

    if (err) { setError(err.message); setSaving(false); return; }
    if (data) setPayments((prev) => [data, ...prev]);
    setModalOpen(false);
    setSaving(false);
    setForm({ member_id: '', amount: '', payment_method: 'cash', payment_date: new Date().toISOString().split('T')[0], notes: '' });
    setSearchTerm('');
    router.refresh();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Total collected: <strong style={{ color: 'var(--success)' }}>{formatCurrency(totalRevenue)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} id="add-payment-btn">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        {METHODS.map((method) => {
          const total = payments.filter((p) => p.payment_method === method).reduce((s, p) => s + Number(p.amount), 0);
          return (
            <div key={method} className="stat-card">
              <p className="stat-label">{method.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
              <p className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" id="payments-table">
            <thead>
              <tr>
                <th>Member</th><th>Amount</th><th>Method</th><th>Date</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No payments recorded yet.</td></tr>
              )}
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.member?.profile?.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                  <td><span className="badge badge-neutral">{p.payment_method.replace('_', ' ')}</span></td>
                  <td>{formatDate(p.payment_date)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${saving ? 'btn-loading' : ''}`} onClick={handleSave} disabled={saving} id="save-payment-btn">
              {saving ? <span className="spinner" /> : <DollarSign size={15} />}
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div className="alert alert-danger"><AlertCircle size={15} />{error}</div>}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Member <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="Search member name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                if (form.member_id) setForm((prev) => ({ ...prev, member_id: '' }));
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: 200, overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)'
              }}>
                {filteredMembers.length === 0 ? (
                  <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No members found</div>
                ) : (
                  filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, member_id: m.id }));
                        setSearchTerm(m.profile?.full_name ?? '');
                        setShowDropdown(false);
                      }}
                      style={{
                        padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                        color: form.member_id === m.id ? 'var(--primary)' : 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {m.profile?.full_name ?? 'Unknown'}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Amount (USD) <span className="required">*</span></label>
              <input name="amount" type="number" min="0" step="0.01" className="form-input"
                placeholder="0.00" value={form.amount} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select name="payment_method" className="form-input" value={form.payment_method} onChange={handleChange}>
                {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input name="payment_date" type="date" className="form-input" value={form.payment_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input name="notes" type="text" className="form-input" placeholder="e.g. Monthly renewal" value={form.notes} onChange={handleChange} />
          </div>
        </div>
      </Modal>
    </>
  );
}
