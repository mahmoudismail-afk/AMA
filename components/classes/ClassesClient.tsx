'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Clock, Users, MapPin, Trash2, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const EMPTY = {
  class_type_id: '',
  trainer_id: '',
  title: '',
  class_date: '',
  start_h: '09', start_m: '00', start_a: 'AM',
  end_h: '10', end_m: '00', end_a: 'AM',
  capacity: '20',
  location: '',
  status: 'scheduled',
  repeat: 'none',
  occurrences: '4',
};

// Combine date, h, m, a into ISO timestamp
function toISO(date: string, h: string, m: string, a: string) {
  if (!date || !h || !m || !a) return '';
  let hour = parseInt(h, 10);
  if (a === 'PM' && hour < 12) hour += 12;
  if (a === 'AM' && hour === 12) hour = 0;
  const hh = hour.toString().padStart(2, '0');
  return new Date(`${date}T${hh}:${m}:00`).toISOString();
}

function parseTime(isoStr: string) {
  if (!isoStr) return { h: '12', m: '00', a: 'AM' };
  const d = new Date(isoStr);
  let hr = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const a = hr >= 12 ? 'PM' : 'AM';
  if (hr > 12) hr -= 12;
  if (hr === 0) hr = 12;
  const h = hr.toString().padStart(2, '0');
  return { h, m, a };
}

// Add days/weeks/months to a date string
function addInterval(dateStr: string, repeat: string, step: number): string {
  const d = new Date(dateStr);
  if (repeat === 'weekly') d.setDate(d.getDate() + 7 * step);
  else if (repeat === 'biweekly') d.setDate(d.getDate() + 14 * step);
  else if (repeat === 'monthly') d.setMonth(d.getMonth() + step);
  return d.toISOString().split('T')[0];
}

function repeatLabel(r: string) {
  if (r === 'weekly') return 'Every week';
  if (r === 'biweekly') return 'Every 2 weeks';
  if (r === 'monthly') return 'Every month';
  return '';
}

export default function ClassesClient({ schedules: initial, classTypes, trainers }: {
  schedules: any[];
  classTypes: any[];
  trainers: any[];
}) {
  const router = useRouter();
  const [schedules, setSchedules] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  function openNew() {
    setEditItem(null);
    setForm(EMPTY);
    setSaveError('');
    setModalOpen(true);
  }

  function openEdit(s: any) {
    setEditItem(s);
    const dt = s.start_time ? new Date(s.start_time) : null;
    const sT = parseTime(s.start_time);
    const eT = parseTime(s.end_time);
    setForm({
      class_type_id: s.class_type_id ?? '',
      trainer_id: s.trainer_id ?? '',
      title: s.title ?? '',
      class_date: dt ? dt.toISOString().split('T')[0] : '',
      start_h: sT.h, start_m: sT.m, start_a: sT.a,
      end_h: eT.h, end_m: eT.m, end_a: eT.a,
      capacity: String(s.capacity ?? 20),
      location: s.location ?? '',
      status: s.status ?? 'scheduled',
      repeat: 'none',
      occurrences: '4',
    });
    setSaveError('');
    setModalOpen(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    if (!form.title || !form.class_type_id || !form.class_date) {
      setSaveError('Title, type, and date are required.');
      return;
    }
    setSaveError('');
    setSaving(true);
    const supabase = createClient();

    const buildPayload = (dateStr: string) => ({
      class_type_id: form.class_type_id,
      trainer_id: form.trainer_id || null,
      title: form.title,
      start_time: toISO(dateStr, form.start_h, form.start_m, form.start_a),
      end_time: toISO(dateStr, form.end_h, form.end_m, form.end_a),
      capacity: Number(form.capacity),
      location: form.location || null,
      status: form.status,
    });

    if (editItem) {
      // Edit: just update this one occurrence
      const { data, error } = await supabase
        .from('class_schedules')
        .update(buildPayload(form.class_date))
        .eq('id', editItem.id)
        .select('*, class_type:class_types(name, color), trainer:trainers(profile:profiles(full_name))')
        .single();
      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) setSchedules((prev) => prev.map((s) => s.id === editItem.id ? data : s));
    } else {
      // Create — with optional recurrence
      const count = form.repeat === 'none' ? 1 : Math.max(1, Math.min(52, Number(form.occurrences)));
      const inserts = [];

      for (let i = 0; i < count; i++) {
        const dateStr = i === 0 ? form.class_date : addInterval(form.class_date, form.repeat, i);
        inserts.push(buildPayload(dateStr));
      }

      const { data, error } = await supabase
        .from('class_schedules')
        .insert(inserts)
        .select('*, class_type:class_types(name, color), trainer:trainers(profile:profiles(full_name))');

      if (error) { setSaveError(error.message); setSaving(false); return; }
      if (data) setSchedules((prev) => [...data, ...prev]);
    }

    setModalOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from('class_schedules').delete().eq('id', deleteId);
    setSchedules((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  }

  const statusColor: Record<string, string> = {
    scheduled: 'badge-primary',
    cancelled: 'badge-danger',
    completed: 'badge-success',
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{schedules.length} session{schedules.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        <button className="btn btn-primary" onClick={openNew} id="add-class-btn">
          <Plus size={16} /> Schedule Class
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><Calendar size={28} /></div>
          <h3 style={{ color: 'var(--text-primary)' }}>No classes scheduled</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create your first class schedule.</p>
          <button className="btn btn-primary btn-sm" onClick={openNew}>Schedule Class</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" id="classes-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Type</th>
                <th>Trainer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => {
                const start = s.start_time ? new Date(s.start_time) : null;
                const end = s.end_time ? new Date(s.end_time) : null;
                const timeStr = start && end
                  ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : '—';
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: s.class_type?.color ?? 'var(--text-secondary)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.class_type?.color ?? 'var(--text-muted)', flexShrink: 0 }} />
                        {s.class_type?.name ?? '—'}
                      </span>
                    </td>
                    <td>{s.trainer?.profile?.full_name ?? <span style={{ color: 'var(--text-disabled)' }}>—</span>}</td>
                    <td>{start ? formatDate(start.toISOString()) : '—'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}>
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} /> {timeStr}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}>
                        <Users size={12} style={{ color: 'var(--text-muted)' }} /> {s.capacity}
                      </span>
                    </td>
                    <td>{s.location ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}>
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />{s.location}
                      </span>
                    ) : '—'}</td>
                    <td><span className={`badge ${statusColor[s.status] ?? 'badge-neutral'}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(s)} title="Edit"><Edit size={15} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(s.id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        title={editItem ? 'Edit Class' : 'Schedule New Class'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className={`btn btn-primary ${saving ? 'btn-loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
              id="save-class-btn"
            >
              {saving ? <span className="spinner" /> : <Calendar size={15} />}
              {saving ? 'Saving...' : editItem ? 'Save Changes' : `Create${form.repeat !== 'none' ? ` (${form.occurrences}×)` : ''}`}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {saveError && (
            <div className="alert alert-danger">
              <AlertCircle size={15} /> <span>{saveError}</span>
            </div>
          )}

          {/* Title & Type */}
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Class Title <span className="required">*</span></label>
              <input name="title" type="text" className="form-input"
                placeholder="e.g. Morning Yoga" value={form.title} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Class Type <span className="required">*</span></label>
              <select name="class_type_id" className="form-input" value={form.class_type_id} onChange={handleChange}>
                <option value="">Select type...</option>
                {classTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trainer</label>
              <select name="trainer_id" className="form-input" value={form.trainer_id} onChange={handleChange}>
                <option value="">Unassigned</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.profile?.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Class Date <span className="required">*</span>
            </label>
            <input
              name="class_date"
              type="date"
              className="form-input"
              value={form.class_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time pickers — dropdowns */}
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">
                <Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Start Time <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select name="start_h" className="form-input" value={form.start_h} onChange={handleChange} style={{ padding: '0.5rem' }}>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select name="start_m" className="form-input" value={form.start_m} onChange={handleChange} style={{ padding: '0.5rem' }}>
                  {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select name="start_a" className="form-input" value={form.start_a} onChange={handleChange} style={{ padding: '0.5rem' }}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                <Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                End Time <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select name="end_h" className="form-input" value={form.end_h} onChange={handleChange} style={{ padding: '0.5rem' }}>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select name="end_m" className="form-input" value={form.end_m} onChange={handleChange} style={{ padding: '0.5rem' }}>
                  {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select name="end_a" className="form-input" value={form.end_a} onChange={handleChange} style={{ padding: '0.5rem' }}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recurrence — only shown for new classes */}
          {!editItem && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Repeat
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: form.repeat !== 'none' ? '0.875rem' : 0 }}>
                {[
                  { value: 'none', label: 'No repeat' },
                  { value: 'weekly', label: 'Every week' },
                  { value: 'biweekly', label: 'Every 2 weeks' },
                  { value: 'monthly', label: 'Every month' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn btn-sm ${form.repeat === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setForm((prev) => ({ ...prev, repeat: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.repeat !== 'none' && (
                <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  <label className="form-label">Number of occurrences</label>
                  <input
                    name="occurrences"
                    type="number"
                    min="2"
                    max="52"
                    className="form-input"
                    value={form.occurrences}
                    onChange={handleChange}
                    style={{ maxWidth: 120 }}
                  />
                  <span className="form-hint">
                    Will create {form.occurrences} classes — {repeatLabel(form.repeat)} starting {form.class_date || '(pick a date)'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Details row */}
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input name="capacity" type="number" min="1" className="form-input"
                  value={form.capacity} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input name="location" type="text" className="form-input"
                  placeholder="Studio A" value={form.location} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        loading={deleting}
        message="Are you sure you want to delete this class? All bookings for it will be removed."
        confirmLabel="Delete Class"
      />
    </>
  );
}
