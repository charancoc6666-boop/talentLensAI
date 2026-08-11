'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { UserPlus, User, Briefcase, Mail, Key, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'HR' | 'APPLICANT'>('HR');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || (role === 'HR' && !orgName)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, orgName }),
      });

      if (res.ok) {
        setSuccess(true);
        const dest = role === 'HR' ? '/hr/dashboard' : '/applicant/dashboard';
        setTimeout(() => {
          router.push(dest);
          router.refresh();
        }, 1000);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed.');
      }
    } catch (e) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <div style={styles.card} className="glass-panel">
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Create Account</h2>
            <p style={styles.cardSubtitle}>Get started with Z.AI TalentLens platform</p>
          </div>

          {error && (
            <div style={styles.alertError}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={styles.alertSuccess}>
              <CheckCircle2 size={18} />
              <span>Registration successful! Directing to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Role Selector Toggle */}
            <div className="form-group">
              <label className="form-label">I want to register as:</label>
              <div style={styles.roleToggleGroup}>
                <button
                  type="button"
                  onClick={() => setRole('HR')}
                  style={{
                    ...styles.roleToggleBtn,
                    borderColor: role === 'HR' ? 'var(--accent-blue)' : 'var(--border-color)',
                    backgroundColor: role === 'HR' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    color: role === 'HR' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Briefcase size={16} /> HR / Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setRole('APPLICANT')}
                  style={{
                    ...styles.roleToggleBtn,
                    borderColor: role === 'APPLICANT' ? 'var(--accent-purple)' : 'var(--border-color)',
                    backgroundColor: role === 'APPLICANT' ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                    color: role === 'APPLICANT' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <User size={16} /> Job Applicant
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  style={styles.input}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={styles.input}
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                />
              </div>
            </div>

            {role === 'HR' && (
              <div className="form-group">
                <label className="form-label" htmlFor="orgName">Organization / Company Name</label>
                <div style={styles.inputWrapper}>
                  <Shield size={16} style={styles.inputIcon} />
                  <input
                    id="orgName"
                    type="text"
                    className="form-input"
                    style={styles.input}
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={loading || success}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={styles.inputWrapper}>
                <Key size={16} style={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading || success}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div style={styles.cardFooter}>
            <span style={styles.footerText}>
              Already have an account? <Link href="/login" style={styles.footerLink}>Sign In</Link>
            </span>
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 24px',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  cardHeader: {
    textAlign: 'center' as const,
  },
  cardTitle: {
    fontSize: '1.8rem',
    marginBottom: '8px',
  },
  cardSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  roleToggleGroup: {
    display: 'flex',
    gap: '10px',
  },
  roleToggleBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  input: {
    width: '100%',
    paddingLeft: '40px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '12px',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    color: '#f87171',
    fontSize: '0.85rem',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    color: '#34d399',
    fontSize: '0.85rem',
  },
  cardFooter: {
    textAlign: 'center' as const,
    marginTop: '12px',
  },
  footerText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  footerLink: {
    color: 'var(--accent-indigo)',
    fontWeight: 600,
  },
};
