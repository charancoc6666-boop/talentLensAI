'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Briefcase, Search, BarChart3, Shield } from 'lucide-react';

interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  orgId?: string;
  orgRole?: string;
}

export default function Navbar() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        }
      } catch (e) {
        console.error('Failed to retrieve session', e);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <nav style={styles.nav} className="glass-panel">
      <div style={styles.container}>
        <div style={styles.left}>
          <Link href="/" style={styles.logoLink}>
            <span style={styles.logoText}>TalentLens<span style={styles.logoHighlight}>AI</span></span>
          </Link>
          
          {session && session.role === 'HR' && (
            <div style={styles.menu}>
              <Link href="/hr/dashboard" style={styles.link}>
                <Briefcase size={16} /> Dashboard
              </Link>
              <Link href="/hr/search" style={styles.link}>
                <Search size={16} /> Talent Search
              </Link>
              <Link href="/hr/compare" style={styles.link}>
                <BarChart3 size={16} /> Compare
              </Link>
            </div>
          )}

          {session && session.role === 'APPLICANT' && (
            <div style={styles.menu}>
              <Link href="/applicant/dashboard" style={styles.link}>
                <User size={16} /> My Dashboard
              </Link>
            </div>
          )}
        </div>

        <div style={styles.right}>
          {loading ? (
            <span style={styles.loading}>Loading...</span>
          ) : session ? (
            <div style={styles.userProfile}>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{session.name}</span>
                <span style={styles.userRole}>
                  {session.role === 'HR' ? `HR [${session.orgRole || 'Member'}]` : 'Applicant'}
                </span>
              </div>
              
              <button onClick={handleLogout} style={styles.logoutBtn} className="btn btn-secondary btn-sm">
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link href="/login" className="btn btn-secondary btn-sm" style={{ marginRight: '10px' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    width: '100%',
    padding: '12px 24px',
    borderRadius: '0px',
    borderBottom: '1px solid var(--border-color)',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    backgroundColor: 'rgba(7, 9, 19, 0.85)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
  },
  logoHighlight: {
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  loading: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  authLinks: {
    display: 'flex',
    alignItems: 'center',
  },
};
