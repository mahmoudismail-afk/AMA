'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Phone, UserCheck, AlertCircle } from 'lucide-react';
import { createTrainer, updateTrainer, deleteTrainer } from '@/lib/actions/trainers';
import { getInitials } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const EMPTY = { full_name: '', phone: '', bio: '', certifications: '', specialties: '', is_active: true };

export default function TrainersClient({ trainers: initial }: { trainers: any[] }) {
  const router = useRouter();
  const [trainers, setTrainers] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTrainer, setEditTrainer] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  function openNew() {
    setEditTrainer(null);
    setForm(EMPTY);
    setSaveError('');
    setModalOpen(true);
  }

  function openEdit(t: any) {
    setEditTrainer(t);
    setForm({
      full_name: t.profile?.full_name ?? '',
      phone: t.profile?.phone ?? '',
      bio: t.bio ?? '',
      certifications: (t.certifications ?? []).join(', '),
      specialties: (t.specialties ?? []).join(', '),
      is_active: t.is_active,
    });
    setSaveError('');
    setModalOpen(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: val }));
  }

  function parseList(str: string) {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave() {
    if (!form.full_name.trim()) { setSaveError('Full name is required.'); return; }
    setSaveError('');
    setSaving(true);

    const payload = {
      full_name: form.full_name,
      phone: form.phone || undefined,
      bio: form.bio || undefined,
      certifications: parseList(form.certifications),
      specialties: parseList(form.specialties),
      is_active: form.is_active as boolean,
    };

    if (editTrainer) {
      const result = await updateTrainer(editTrainer.id, editTrainer.profile_id, payload);
      if (result.error) { setSaveError(result.error); setSaving(false); return; }
      // Refresh list from server
      router.refresh();
    } else {
      const result = await createTrainer(payload);
      if (result.error) { setSaveError(result.error); setSaving(false); return; }
      if (result.trainer) setTrainers((prev) => [...prev, result.trainer]);
      router.refresh();
    }

    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteTrainer(deleteId);
    if (!result.error) setTrainers((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trainers</h1>
          <p className="page-subtitle">{trainers.length} trainer{trainers.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew} id="add-trainer-btn">
          <Plus size={16} /> Add Trainer
        </button>
      </div>

      <div className="grid-3" style={{ alignItems: 'start' }}>
        {trainers.map((t) => {
          const name = t.profile?.full_name ?? 'Unknown';
          return (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)', fontSize: '1.1rem', fontWeight: 700 }}>
                  {getInitials(name)}
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{name}</h3>
                  <span className={`badge ${t.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {t.bio && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.875rem', lineHeight: 1.6 }}>
                  {t.bio}
                </p>
              )}

              {t.profile?.phone && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <Phone size={13} style={{ color: 'var(--text-muted)' }} /> {t.profile.phone}
                </div>
              )}

              {(t.specialties ?? []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                  {t.specialties.map((s: string) => (
                    <span key={s} className="badge badge-primary">{s}</span>
                  ))}
                </div>
              )}

              {(t.certifications ?? []).length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
                  🏅 {t.certifications.join(' · ')}
                </div>
              )}

              <div className="divider" style={{ margin: '0.875rem 0' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(t)}>
                  <Edit size={14} /> Edit
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteId(t.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {trainers.length === 0 && (
          <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon"><UserCheck size={28} /></div>
            <h3 style={{ color: 'var(--text-primary)' }}>No trainers yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Add your gym trainers to assign them to classes.</p>
            <button className="btn btn-primary btn-sm" onClick={openNew}>Add Trainer</button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTrainer ? 'Edit Trainer' : 'Add Trainer'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className={`btn btn-primary ${saving ? 'btn-loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
              id="save-trainer-btn"
            >
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving...' : 'Save Trainer'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveError && (
            <div className="alert alert-danger">
              <AlertCircle size={15} /> <span>{saveError}</span>
            </div>
          )}

          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input name="full_name" type="text" className="form-input"
                placeholder="Jane Doe" value={form.full_name} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Phone <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional)</span></label>
              <input name="phone" type="tel" className="form-input"
                placeholder="+1 555 000 0000" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea name="bio" className="form-input" rows={3}
              placeholder="Short bio..." value={form.bio} onChange={handleChange as any}
              style={{ resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Specialties</label>
            <input name="specialties" type="text" className="form-input"
              placeholder="CrossFit, HIIT, Yoga" value={form.specialties} onChange={handleChange} />
            <span className="form-hint">Separate with commas.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Certifications</label>
            <input name="certifications" type="text" className="form-input"
              placeholder="ACE, NASM, CSCS" value={form.certifications} onChange={handleChange} />
            <span className="form-hint">Separate with commas.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <input type="checkbox" id="trainer-active" name="is_active"
              checked={form.is_active as boolean} onChange={handleChange}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
            <label htmlFor="trainer-active" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Active trainer
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Trainer"
        loading={deleting}
        message="Are you sure you want to remove this trainer? Their class assignments will be cleared."
        confirmLabel="Remove Trainer"
      />
    </>
  );
}
