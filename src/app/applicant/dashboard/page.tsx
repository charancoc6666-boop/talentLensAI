'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  User,
  GitBranch,
  Link as LinkIcon,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Save,
  FileText,
  Shield,
  Star,
  ExternalLink
} from 'lucide-react';

interface Profile {
  id?: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
}

interface ApplicationEntry {
  id: string;
  jobTitle: string;
  department: string | null;
  company: string;
  location: string | null;
  salaryRange: string | null;
  status: string;
  jobMatchScore: number;
  atsScore: number;
  strengths: string;
  gaps: string;
  aiSummary: string | null;
  appliedAt: string;
}

export default function ApplicantDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'feedback'>('overview');

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Expanded feedback card
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplicantData() {
      try {
        const res = await fetch('/api/applicants/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setApplications(data.applications || []);

          // Pre-fill edit form
          setEditName(data.profile.name || '');
          setEditPhone(data.profile.phone || '');
          setEditLocation(data.profile.location || '');
          setEditGithub(data.profile.githubUrl || '');
          setEditPortfolio(data.profile.portfolioUrl || '');
        }
      } catch (e) {
        console.error('Error loading applicant dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadApplicantData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/applicants/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          location: editLocation,
          githubUrl: editGithub,
          portfolioUrl: editPortfolio,
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to update profile.');
      }
    } catch (e) {
      console.error('Error saving profile:', e);
      setSaveMessage('Connection error.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'NEW': { label: 'Submitted', color: 'var(--text-muted)', icon: <Clock size={14} /> },
      'AI_SCREENED': { label: 'AI Screened', color: 'var(--accent-cyan)', icon: <Shield size={14} /> },
      'REVIEW': { label: 'Under Review', color: 'var(--match-review)', icon: <FileText size={14} /> },
      'SHORTLISTED': { label: 'Shortlisted', color: 'var(--match-excellent)', icon: <Star size={14} /> },
      'INTERVIEW': { label: 'Interview Stage', color: 'var(--accent-blue)', icon: <Briefcase size={14} /> },
      'OFFER': { label: 'Offer Extended', color: 'var(--match-excellent)', icon: <CheckCircle size={14} /> },
      'REJECTED': { label: 'Not Selected', color: 'var(--match-weak)', icon: <AlertTriangle size={14} /> },
    };
    return labels[status] || { label: status, color: 'var(--text-muted)', icon: <Clock size={14} /> };
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading your dashboard...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        {/* Welcome Header */}
        <div style={styles.welcomeCard} className="glass-panel">
          <div style={styles.welcomeInfo}>
            <div style={styles.avatar}>
              <User size={32} color="var(--accent-blue)" />
            </div>
            <div>
              <h1 style={styles.welcomeTitle}>Welcome back, {profile?.name || 'Applicant'}</h1>
              <p style={styles.welcomeSub}>
                {applications.length > 0
                  ? `You have ${applications.length} active application${applications.length > 1 ? 's' : ''} being evaluated.`
                  : 'Complete your profile below to get started with job applications.'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={styles.quickStats}>
            <div style={styles.statBox}>
              <span style={styles.statVal}>{applications.length}</span>
              <span style={styles.statLbl}>Applications</span>
            </div>
            <div style={styles.statBox}>
              <span style={{...styles.statVal, color: 'var(--match-excellent)'}}>
                {applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW' || a.status === 'OFFER').length}
              </span>
              <span style={styles.statLbl}>Shortlisted</span>
            </div>
            <div style={styles.statBox}>
              <span style={{...styles.statVal, color: 'var(--accent-blue)'}}>
                {applications.length > 0 ? Math.max(...applications.map(a => a.jobMatchScore)) : 0}%
              </span>
              <span style={styles.statLbl}>Best Match</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabsRow}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{...styles.tabBtn, borderBottomColor: activeTab === 'overview' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)'}}
          >
            <Briefcase size={16} /> My Applications
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{...styles.tabBtn, borderBottomColor: activeTab === 'profile' ? 'var(--accent-purple)' : 'transparent', color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)'}}
          >
            <User size={16} /> Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{...styles.tabBtn, borderBottomColor: activeTab === 'feedback' ? 'var(--match-excellent)' : 'transparent', color: activeTab === 'feedback' ? 'var(--text-primary)' : 'var(--text-secondary)'}}
          >
            <TrendingUp size={16} /> AI Feedback & Tips
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: '24px' }}>

          {/* TAB 1: Applications Overview */}
          {activeTab === 'overview' && (
            <div style={styles.applicationsGrid}>
              {applications.length === 0 ? (
                <div className="glass-panel" style={styles.emptyState}>
                  <Briefcase size={40} style={{ color: 'var(--text-muted)' }} />
                  <h3 style={{ marginTop: '12px' }}>No Applications Yet</h3>
                  <p>Your application history will appear here once recruiters process your resume submissions.</p>
                </div>
              ) : (
                applications.map(app => {
                  const statusInfo = getStatusLabel(app.status);
                  return (
                    <div key={app.id} className="glass-panel animate-fade-in" style={styles.applicationCard}>
                      {/* Card Header */}
                      <div style={styles.cardHeader}>
                        <div>
                          <h3 style={styles.cardJobTitle}>{app.jobTitle}</h3>
                          <span style={styles.cardCompany}>{app.company} · {app.department}</span>
                        </div>
                        <div style={{...styles.statusBadge, color: statusInfo.color, borderColor: statusInfo.color}}>
                          {statusInfo.icon} {statusInfo.label}
                        </div>
                      </div>

                      {/* Card Meta */}
                      <div style={styles.cardMeta}>
                        {app.location && <span style={styles.metaItem}><MapPin size={13} /> {app.location}</span>}
                        {app.salaryRange && <span style={styles.metaItem}>{app.salaryRange}</span>}
                        <span style={styles.metaItem}><Clock size={13} /> Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Scores Row */}
                      <div style={styles.scoresRow}>
                        <div style={styles.scoreChip}>
                          <span style={styles.scoreChipLabel}>Job Match</span>
                          <span style={{...styles.scoreChipValue, color: app.jobMatchScore >= 75 ? 'var(--match-excellent)' : 'var(--match-review)'}}>
                            {app.jobMatchScore}%
                          </span>
                        </div>
                        <div style={styles.scoreChip}>
                          <span style={styles.scoreChipLabel}>ATS Score</span>
                          <span style={{...styles.scoreChipValue, color: app.atsScore >= 75 ? 'var(--match-excellent)' : 'var(--match-review)'}}>
                            {app.atsScore}%
                          </span>
                        </div>
                      </div>

                      {/* Pipeline Progress */}
                      <div style={styles.pipelineRow}>
                        {['NEW', 'AI_SCREENED', 'REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFER'].map((stage, i) => {
                          const stageOrder = ['NEW', 'AI_SCREENED', 'REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFER'];
                          const currentIndex = stageOrder.indexOf(app.status);
                          const isActive = i <= currentIndex && app.status !== 'REJECTED';
                          const isRejected = app.status === 'REJECTED';
                          return (
                            <div key={stage} style={{...styles.pipelineDot, background: isRejected ? 'var(--match-weak)' : (isActive ? 'var(--accent-blue)' : 'var(--bg-tertiary)')}}></div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Edit Profile */}
          {activeTab === 'profile' && (
            <div className="glass-panel" style={styles.profileCard}>
              <h2 style={styles.sectionTitle}>Your Professional Profile</h2>
              <p style={styles.sectionDesc}>Keep your profile updated so recruiters can verify your credentials and contact you.</p>

              <form onSubmit={handleSaveProfile} style={styles.profileForm}>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label"><User size={14} style={{marginRight: '6px'}} /> Full Name</label>
                    <input className="form-input" type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Jane Doe" />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><Mail size={14} style={{marginRight: '6px'}} /> Email (read-only)</label>
                    <input className="form-input" type="email" value={profile?.email || ''} disabled style={{opacity: 0.6}} />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><Phone size={14} style={{marginRight: '6px'}} /> Phone Number</label>
                    <input className="form-input" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><MapPin size={14} style={{marginRight: '6px'}} /> Location</label>
                    <input className="form-input" type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="San Francisco, CA" />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><GitBranch size={14} style={{marginRight: '6px'}} /> GitHub Profile URL</label>
                    <input className="form-input" type="url" value={editGithub} onChange={e => setEditGithub(e.target.value)} placeholder="https://github.com/username" />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><LinkIcon size={14} style={{marginRight: '6px'}} /> Portfolio URL</label>
                    <input className="form-input" type="url" value={editPortfolio} onChange={e => setEditPortfolio(e.target.value)} placeholder="https://portfolio.dev" />
                  </div>
                </div>

                {saveMessage && (
                  <div style={{...styles.saveMessage, color: saveMessage.includes('success') ? 'var(--match-excellent)' : 'var(--match-weak)'}}>
                    {saveMessage}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: '24px', padding: '12px 32px' }} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: AI Feedback & Tips */}
          {activeTab === 'feedback' && (
            <div style={styles.feedbackContainer}>
              <div className="glass-panel" style={styles.feedbackIntro}>
                <TrendingUp size={24} color="var(--accent-purple)" />
                <h2 style={{fontSize: '1.3rem', fontWeight: 700, marginTop: '8px'}}>AI Improvement Recommendations</h2>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px'}}>
                  Based on your application evaluations, here are personalized suggestions to strengthen your candidacy.
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="glass-panel" style={styles.emptyState}>
                  <p>Submit applications to receive personalized AI feedback.</p>
                </div>
              ) : (
                <div style={styles.feedbackList}>
                  {applications.map(app => {
                    const strengths = JSON.parse(app.strengths || '[]') as string[];
                    const gaps = JSON.parse(app.gaps || '[]') as Array<{skill: string; importance: string; recommendation: string}>;
                    const isExpanded = expandedFeedback === app.id;

                    return (
                      <div key={app.id} className="glass-panel animate-fade-in" style={styles.feedbackCard}>
                        <div style={styles.feedbackHeader} onClick={() => setExpandedFeedback(isExpanded ? null : app.id)}>
                          <div>
                            <h3 style={{fontSize: '1.1rem', fontWeight: 700}}>{app.jobTitle}</h3>
                            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{app.company} · Match: {app.jobMatchScore}%</span>
                          </div>
                          <span style={{fontSize: '0.8rem', color: 'var(--accent-blue)', cursor: 'pointer'}}>
                            {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div style={styles.feedbackBody} className="animate-fade-in">
                            {/* AI Summary */}
                            {app.aiSummary && (
                              <div style={styles.feedbackSection}>
                                <h4 style={styles.feedbackSectionTitle}>AI Assessment Summary</h4>
                                <p style={styles.feedbackText}>{app.aiSummary}</p>
                              </div>
                            )}

                            {/* What's working */}
                            {strengths.length > 0 && (
                              <div style={styles.feedbackSection}>
                                <h4 style={{...styles.feedbackSectionTitle, color: 'var(--match-excellent)'}}>✓ What's Working Well</h4>
                                <ul style={styles.feedbackBullets}>
                                  {strengths.map((s, i) => (
                                    <li key={i} style={styles.feedbackBulletItem}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Areas to improve */}
                            {gaps.length > 0 && (
                              <div style={styles.feedbackSection}>
                                <h4 style={{...styles.feedbackSectionTitle, color: 'var(--match-review)'}}>⚠ Areas to Strengthen</h4>
                                {gaps.map((gap, i) => (
                                  <div key={i} style={styles.gapCard}>
                                    <div style={styles.gapCardHeader}>
                                      <strong>{gap.skill}</strong>
                                      <span style={styles.gapImportance}>{gap.importance}</span>
                                    </div>
                                    <p style={styles.gapRec}>💡 {gap.recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 24px 100px 24px',
  },
  loadingContainer: {
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.05)',
    borderTop: '4px solid var(--accent-blue)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  welcomeCard: {
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '24px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%), var(--bg-card)',
  },
  welcomeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: 1,
    minWidth: '280px',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '2px solid rgba(59, 130, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  welcomeTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    marginBottom: '4px',
  },
  welcomeSub: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  quickStats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  statBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 20px',
    minWidth: '100px',
    textAlign: 'center' as const,
  },
  statVal: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
  statLbl: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    marginTop: '2px',
    display: 'block',
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid var(--border-color)',
    marginTop: '32px',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '12px 16px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  // Applications Grid
  applicationsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  applicationCard: {
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    gap: '16px',
    marginBottom: '12px',
  },
  cardJobTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '2px',
  },
  cardCompany: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: 700,
    padding: '5px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    background: 'rgba(255,255,255,0.02)',
    whiteSpace: 'nowrap' as const,
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  scoresRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  scoreChip: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 16px',
  },
  scoreChipLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  scoreChipValue: {
    fontSize: '1.1rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
  },
  pipelineRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  pipelineDot: {
    flex: 1,
    height: '4px',
    borderRadius: 'var(--radius-full)',
    transition: 'all 0.3s ease',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  // Profile
  profileCard: {
    padding: '32px',
  },
  sectionTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '6px',
  },
  sectionDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginBottom: '24px',
  },
  profileForm: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    '@media (maxWidth: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  saveMessage: {
    marginTop: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  // Feedback
  feedbackContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  feedbackIntro: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  feedbackCard: {
    padding: '24px',
    cursor: 'pointer',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackBody: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  feedbackSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  feedbackSectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  feedbackText: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
  },
  feedbackBullets: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    padding: 0,
  },
  feedbackBulletItem: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
    color: 'var(--text-secondary)',
    paddingLeft: '16px',
    position: 'relative' as const,
  },
  gapCard: {
    borderLeft: '2px solid var(--match-review)',
    paddingLeft: '12px',
    marginBottom: '8px',
  },
  gapCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  gapImportance: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  gapRec: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
};
