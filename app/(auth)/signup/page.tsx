'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Dumbbell, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import '../auth.css';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'admin',
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, redirect immediately
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    // Email confirmation required
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-card animate-slide" style={{ textAlign: 'center' }}>
          <div className="auth-success-icon">
            <CheckCircle size={48} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Check your email!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            We&apos;ve sent a confirmation link to <strong style={{ color: 'var(--text-secondary)' }}>{formData.email}</strong>.
            Click the link to activate your account.
          </p>
          <Link href="/login" className="btn btn-primary btn-full">Back to Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card animate-slide">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Dumbbell size={28} />
          </div>
          <span className="auth-logo-text">GymPro</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Set up your gym management system</p>
        </div>

        {error && (
          <div className="alert alert-danger animate-fade">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="auth-form" id="signup-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full name <span className="required">*</span></label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-input"
                placeholder="John Smith"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email address <span className="required">*</span></label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="admin@gym.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone number</label>
            <div className="input-with-icon">
              <Phone size={16} className="input-icon" />
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Password <span className="required">*</span></label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm <span className="required">*</span></label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            id="signup-submit"
            type="submit"
            className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link href="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
