'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ChevronLeft, BarChart3, Award, Users, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  email: string;
}

interface Application {
  id: string;
  applicant: Applicant;
  status: string;
  jobMatchScore: number;
  atsScore: number;
  portfolioScore: number;
  technicalEvidenceScore: number;
  confidence: string;
  skillsAnalysis: string;
  strengths: string;
  gaps: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const idsParam = searchParams.get('ids') || '';
  const selectedIds = idsParam.split(',').filter(id => id.length > 0);

  const [candidates, setCandidates] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Developer');

  useEffect(() => {
    async function loadCandidates() {
      if (!jobId || selectedIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/applications?jobId=${jobId}`);
        if (res.ok) {
          const data = await res.json();
          const allApps: Application[] = data.applications || [];
          
          // Filter to only matching selected IDs
          const filtered = allApps.filter(app => selectedIds.includes(app.id));
          setCandidates(filtered);

          if (filtered.length > 0) {
            // Fetch job metadata for display
            const jobRes = await fetch(`/api/jobs/${jobId}`);
            if (jobRes.ok) {
              const jobData = await jobRes.json();
              setJobTitle(jobData.job.title);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching comparison candidates:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, [jobId, idsParam]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <span style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Comparing candidates...</span>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div style={styles.emptyState}>
        <BarChart3 size={40} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ marginTop: '12px' }}>No Candidates Selected</h3>
        <p>Go back to the job dashboard and select candidates to compare.</p>
        {jobId && (
          <Link href={`/hr/jobs/${jobId}`} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
            Back to Job Dashboard
          </Link>
        )}
      </div>
    );
  }

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-strong';
    if (score >= 60) return 'score-review';
    return 'score-weak';
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <Link href={`/hr/jobs/${jobId}`} style={styles.backLink}>
          <ChevronLeft size={16} /> Back to Job Dashboard
        </Link>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Candidate Comparison Matrix</h1>
        <p style={styles.subtitle}>Comparing {candidates.length} candidates for "{jobTitle}"</p>
      </div>

      {/* Comparison Grid */}
      <div style={styles.matrixCard} className="glass-panel">
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.thKey}>Candidate Metrics</th>
                {candidates.map((cand) => (
                  <th key={cand.id} style={styles.thCand}>
                    <div style={styles.candHeaderBlock}>
                      <span style={styles.candName}>{cand.applicant.name}</span>
                      <span style={styles.candEmail}>{cand.applicant.email}</span>
                      <Link href={`/hr/applications/${cand.id}`} className="btn btn-secondary btn-sm" style={styles.viewProfileBtn}>
                        View Profile <ExternalLink size={12} />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Row: Overall Match */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>Overall Job Match</td>
                {candidates.map((cand) => (
                  <td key={cand.id} style={styles.tdValue}>
                    <span className={`score-badge ${getScoreColorClass(cand.jobMatchScore)}`} style={styles.badgeLarge}>
                      {cand.jobMatchScore}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: ATS Score */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>ATS Keyword Score</td>
                {candidates.map((cand) => (
                  <td key={cand.id} style={styles.tdValue}>
                    <span className={`score-badge ${getScoreColorClass(cand.atsScore)}`} style={styles.badgeSmall}>
                      {cand.atsScore}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Portfolio Score */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>Portfolio Relevance</td>
                {candidates.map((cand) => (
                  <td key={cand.id} style={styles.tdValue}>
                    <span className={`score-badge ${getScoreColorClass(cand.portfolioScore)}`} style={styles.badgeSmall}>
                      {cand.portfolioScore}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Technical Evidence */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>Technical Evidence</td>
                {candidates.map((cand) => (
                  <td key={cand.id} style={styles.tdValue}>
                    <span className={`score-badge ${getScoreColorClass(cand.technicalEvidenceScore)}`} style={styles.badgeSmall}>
                      {cand.technicalEvidenceScore}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Confidence Level */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>AI Match Confidence</td>
                {candidates.map((cand) => (
                  <td key={cand.id} style={styles.tdValue}>
                    <span style={{ fontWeight: 'bold', color: cand.confidence === 'HIGH' ? 'var(--match-excellent)' : 'var(--text-secondary)' }}>
                      {cand.confidence}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Top Strengths */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>Top Strengths</td>
                {candidates.map((cand) => {
                  const strengths = JSON.parse(cand.strengths || '[]') as string[];
                  return (
                    <td key={cand.id} style={styles.tdListValue}>
                      <ul style={styles.list}>
                        {strengths.map((str, idx) => (
                          <li key={idx} style={styles.listItem}>
                            <span style={{ color: 'var(--match-excellent)', marginRight: '6px' }}>✓</span>
                            {str}
                          </li>
                        ))}
                      </ul>
                    </td>
                  );
                })}
              </tr>

              {/* Row: Skill Gaps */}
              <tr style={styles.row}>
                <td style={styles.tdKey}>Identified Gaps</td>
                {candidates.map((cand) => {
                  const gaps = JSON.parse(cand.gaps || '[]') as Array<{ skill: string; importance: string }>;
                  return (
                    <td key={cand.id} style={styles.tdListValue}>
                      {gaps.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No significant gaps</span>
                      ) : (
                        <ul style={styles.list}>
                          {gaps.map((gap, idx) => (
                            <li key={idx} style={styles.listItem}>
                              <span style={{ color: 'var(--match-weak)', marginRight: '6px' }}>⚠️</span>
                              {gap.skill} <span style={styles.gapLabel}>({gap.importance})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CandidateComparisonPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>Preparing comparison matrix...</div>}>
        <CompareContent />
      </Suspense>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 100px 24px',
  },
  loadingContainer: {
    minHeight: '60vh',
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
  emptyState: {
    textAlign: 'center' as const,
    padding: '100px 20px',
  },
  toolbar: {
    marginBottom: '24px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    '&:hover': {
      color: 'var(--text-primary)',
    },
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  matrixCard: {
    padding: '32px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
    tableLayout: 'fixed' as const,
  },
  headerRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  thKey: {
    width: '240px',
    padding: '16px',
    color: 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
  },
  thCand: {
    padding: '16px',
    minWidth: '240px',
    verticalAlign: 'top',
  },
  candHeaderBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  candName: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  candEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  viewProfileBtn: {
    marginTop: '8px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    alignSelf: 'flex-start',
  },
  row: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
  },
  tdKey: {
    padding: '24px 16px',
    fontWeight: 700,
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  tdValue: {
    padding: '24px 16px',
    textAlign: 'center' as const,
    verticalAlign: 'middle',
  },
  tdListValue: {
    padding: '24px 16px',
    verticalAlign: 'top',
  },
  badgeLarge: {
    padding: '8px 16px',
    fontSize: '1.2rem',
    fontWeight: 800,
  },
  badgeSmall: {
    padding: '4px 12px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  list: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    margin: 0,
    padding: 0,
  },
  listItem: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
    color: 'var(--text-secondary)',
  },
  gapLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
  },
};
