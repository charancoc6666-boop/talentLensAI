'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Plus, Briefcase, Users, FileText, CheckCircle2, TrendingUp, Search, Calendar, Shield } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  salaryRange: string | null;
  status: string;
  createdAt: string;
  _count?: {
    applications: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface DashboardMetrics {
  activeJobs: number;
  totalApplicants: number;
  screenedCount: number;
  shortlistedCount: number;
  averageATS: number;
  topCandidate: {
    name: string;
    score: number;
    atsScore: number;
    jobTitle: string;
    experience: string;
  } | null;
}

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingJob, setCreatingJob] = useState(false);

  // Job form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('$130,000 - $160,000');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch jobs and metrics
      const jobsRes = await fetch('/api/jobs');
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
        setMetrics(data.metrics || null);
      }

      // Fetch audit logs
      const auditsRes = await fetch('/api/audits');
      if (auditsRes.ok) {
        const data = await auditsRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setFormError('Job Title and Description are required.');
      return;
    }

    setFormError(null);
    setFormSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          department,
          location,
          employmentType,
          salaryRange,
        }),
      });

      if (res.ok) {
        setFormSuccess(true);
        setTitle('');
        setDescription('');
        setCreatingJob(false);
        // Refresh dashboard data
        await fetchData();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create job.');
      }
    } catch (e) {
      setFormError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading enterprise recruiter console...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        {/* Header Block */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.dashboardTitle}>Recruitment Console</h1>
            <p style={styles.dashboardSubtitle}>AI evidence-based applicant screening platform</p>
          </div>
          <button onClick={() => setCreatingJob(true)} className="btn btn-primary">
            <Plus size={16} /> Create New Job
          </button>
        </div>

        {/* Metrics Row */}
        {metrics && (
          <div style={styles.metricsRow}>
            <div className="glass-panel" style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}>Active Jobs</span>
                <Briefcase size={20} color="var(--accent-blue)" />
              </div>
              <span style={styles.metricValue}>{metrics.activeJobs}</span>
            </div>

            <div className="glass-panel" style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}>Total Applicants</span>
                <Users size={20} color="var(--accent-purple)" />
              </div>
              <span style={styles.metricValue}>{metrics.totalApplicants}</span>
            </div>

            <div className="glass-panel" style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}>ATS Screened</span>
                <FileText size={20} color="var(--accent-cyan)" />
              </div>
              <span style={styles.metricValue}>
                {metrics.screenedCount} <span style={styles.metricSub}>{Math.round((metrics.screenedCount / (metrics.totalApplicants || 1)) * 100)}%</span>
              </span>
            </div>

            <div className="glass-panel" style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}>Mean ATS Score</span>
                <TrendingUp size={20} color="var(--match-excellent)" />
              </div>
              <span style={styles.metricValue}>{metrics.averageATS}%</span>
            </div>
          </div>
        )}

        <div style={styles.mainLayout}>
          {/* Left Column - Active Jobs */}
          <div style={styles.leftCol}>
            <div className="glass-panel" style={styles.panelCard}>
              <h2 style={styles.panelTitle}>Active Job Postings</h2>
              {jobs.length === 0 ? (
                <div style={styles.emptyState}>
                  <Briefcase size={40} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ marginTop: '12px' }}>No job postings created yet. Create a job to start screening.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Job Title</th>
                        <th style={styles.th}>Department</th>
                        <th style={styles.th}>Location</th>
                        <th style={styles.th}>Salary Range</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Applicants</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} style={styles.tableRow}>
                          <td style={styles.td}>
                            <Link href={`/hr/jobs/${job.id}`} style={styles.jobLink}>
                              {job.title}
                            </Link>
                          </td>
                          <td style={styles.td}>{job.department}</td>
                          <td style={styles.td}>{job.location}</td>
                          <td style={styles.td}>{job.salaryRange}</td>
                          <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold' }}>
                            {job._count?.applications || 0}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <Link href={`/hr/jobs/${job.id}`} className="btn btn-secondary btn-sm">
                              View Dashboard
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Candidate Showcase */}
            {metrics?.topCandidate && (
              <div className="glass-panel" style={styles.showcaseCard}>
                <div style={styles.showcaseHeader}>
                  <TrendingUp size={20} color="var(--match-excellent)" />
                  <h3 style={styles.showcaseTitle}>Top Matching Candidate</h3>
                </div>
                <div style={styles.showcaseGrid}>
                  <div>
                    <span style={styles.showcaseLabel}>Candidate Name</span>
                    <span style={styles.showcaseValue}>{metrics.topCandidate.name}</span>
                  </div>
                  <div>
                    <span style={styles.showcaseLabel}>Matched Post</span>
                    <span style={styles.showcaseValue}>{metrics.topCandidate.jobTitle}</span>
                  </div>
                  <div>
                    <span style={styles.showcaseLabel}>Match Score</span>
                    <span className="score-badge score-excellent" style={styles.showcaseBadge}>
                      {metrics.topCandidate.score}%
                    </span>
                  </div>
                  <div>
                    <span style={styles.showcaseLabel}>ATS Score</span>
                    <span className="score-badge score-strong" style={styles.showcaseBadge}>
                      {metrics.topCandidate.atsScore}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Audit Log & Create Job Form */}
          <div style={styles.rightCol}>
            {creatingJob ? (
              <div className="glass-panel" style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Create Job Posting</h2>
                  <button onClick={() => setCreatingJob(false)} style={styles.cancelBtn}>Cancel</button>
                </div>
                
                {formError && <div className="btn-danger btn-sm" style={{ padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>{formError}</div>}
                
                <form onSubmit={handleCreateJob} style={styles.form}>
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Full Stack Developer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. San Francisco (Hybrid)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Employment Type</label>
                      <select
                        className="form-select"
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Salary Range</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. $140,000 - $170,000"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Description</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '120px', resize: 'vertical' }}
                      placeholder="Paste the job description. The AI will automatically extract required skills, weights, experience, and responsibilities."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Generate Posting via AI
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-panel" style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h2 style={styles.panelTitle}>Audit Activity Trail</h2>
                  <Shield size={16} color="var(--text-muted)" />
                </div>
                {auditLogs.length === 0 ? (
                  <div style={styles.emptyState}>
                    <p>No logged actions found.</p>
                  </div>
                ) : (
                  <div style={styles.logList}>
                    {auditLogs.map((log) => (
                      <div key={log.id} style={styles.logItem}>
                        <div style={styles.logMeta}>
                          <span style={styles.logAction}>{log.action.replace(/_/g, ' ')}</span>
                          <span style={styles.logTime}>
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={styles.logDetails}>{log.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 100px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  dashboardTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
  },
  dashboardSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  metricCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: '2.1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  metricSub: {
    fontSize: '0.9rem',
    color: 'var(--match-excellent)',
    fontWeight: 600,
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'start',
    '@media (maxWidth: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  panelCard: {
    padding: '32px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  panelTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 0',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
    fontSize: '0.9rem',
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  th: {
    padding: '12px 16px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    transition: 'all var(--transition-fast)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.01)',
    },
  },
  td: {
    padding: '16px',
    color: 'var(--text-primary)',
  },
  jobLink: {
    color: 'var(--text-primary)',
    fontWeight: 600,
    '&:hover': {
      color: 'var(--accent-indigo)',
    },
  },
  showcaseCard: {
    padding: '24px',
    background: 'radial-gradient(circle at top left, rgba(16, 185, 129, 0.05), transparent), var(--bg-card)',
  },
  showcaseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  showcaseTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  showcaseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  showcaseLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  showcaseValue: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  showcaseBadge: {
    padding: '4px 10px',
    fontSize: '0.8rem',
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    '&:hover': {
      color: 'var(--text-primary)',
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  logItem: {
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '12px',
  },
  logMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  logAction: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--accent-blue)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  logTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  logDetails: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
};
