'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { LogIn, Key, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if demo query param is set
    const isDemo = searchParams.get('demo') === 'recruiter';
    if (isDemo) {
      setEmail('recruiter@talentlens.ai');
      setPassword('password123');
      
      // Auto-trigger demo login
      const timer = setTimeout(() => {
        handleDemoLogin('recruiter@talentlens.ai', 'password123');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });

      if (res.ok) {
        setSuccess(true);
        const data = await res.json();
        const dest = data.user.role === 'HR' ? '/hr/dashboard' : '/applicant/dashboard';
        setTimeout(() => {
          router.push(dest);
          router.refresh();
        }, 800);
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed.');
      }
    } catch (e) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    await handleDemoLogin(email, password);
  };

  return (
    <div style={styles.card} className="glass-panel pulse-glow">
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Sign In</h2>
        <p style={styles.cardSubtitle}>Access your TalentLens AI dashboard</p>
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
          <span>Authenticated! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <div style={styles.inputWrapper}>
            <Mail size={16} style={styles.inputIcon} />
            <input
              id="email"
              type="email"
              className="form-input"
              style={styles.input}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
            />
          </div>
        </div>

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
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div style={styles.divider}>
        <span style={styles.dividerLine}></span>
        <span style={styles.dividerText}>Demo Quick Access</span>
        <span style={styles.dividerLine}></span>
      </div>

      <div style={styles.demoButtons}>
        <button
          onClick={() => handleDemoLogin('recruiter@talentlens.ai', 'password123')}
          className="btn btn-secondary btn-sm"
          style={styles.demoBtn}
          disabled={loading || success}
        >
          🔑 HR Recruiter Demo (Sarah Jenkins)
        </button>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.footerText}>
          Don't have an account? <Link href="/register" style={styles.footerLink}>Register here</Link>
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Loading interface...</div>}>
          <LoginContent />
        </Suspense>
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
    maxWidth: '440px',
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
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '8px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  demoButtons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  demoBtn: {
    justifyContent: 'flex-start',
    padding: '10px 16px',
    fontSize: '0.85rem',
    width: '100%',
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
