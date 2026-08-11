'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  FileText,
  AlertTriangle,
  GitBranch,
  Link as LinkIcon,
  HelpCircle,
  ChevronLeft,
  Printer,
  Save,
  MessageSquareCode,
  FolderDot
} from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
}

interface Job {
  id: string;
  title: string;
}

interface Application {
  id: string;
  jobId: string;
  job: Job;
  applicantId: string;
  applicant: Applicant;
  status: string;
  jobMatchScore: number;
  atsScore: number;
  portfolioScore: number;
  technicalEvidenceScore: number;
  confidence: string;
  aiSummary: string | null;
  skillsAnalysis: string;
  strengths: string;
  gaps: string;
  verificationSignals: string;
  interviewQuestions: string;
  recruiterNotes: string;
  createdAt: string;
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: applicationId } = use(params);

  // States
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const fetchApplicationDetails = async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        setApplication(data.application);
        setNotes(data.application.recruiterNotes || '');
      }
    } catch (e) {
      console.error('Error fetching application details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterNotes: notes })
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    } catch (e) {
      console.error('Failed to save notes:', e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-strong';
    if (score >= 60) return 'score-review';
    return 'score-weak';
  };

  const getVerificationStatusClass = (status: string) => {
    switch (status) {
      case 'Supported':
        return 'score-excellent';
      case 'Partially Supported':
        return 'score-strong';
      case 'Not Sufficiently Supported':
        return 'score-review';
      default:
        return 'score-weak';
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading candidate analysis report...</span>
        </div>
      </>
    );
  }

  if (!application) {
    return (
      <>
        <Navbar />
        <div style={styles.container}>
          <h2>Candidate Evaluation Not Found</h2>
          <p>This application record is invalid or has been archived.</p>
        </div>
      </>
    );
  }

  // Parse JSON columns
  const skillsAnalysis = JSON.parse(application.skillsAnalysis || '[]') as Array<{
    skill: string;
    status: 'Strong Match' | 'Partial Match' | 'Missing';
    evidence: string;
  }>;
  const strengths = JSON.parse(application.strengths || '[]') as string[];
  const gaps = JSON.parse(application.gaps || '[]') as Array<{
    skill: string;
    importance: string;
    recommendation: string;
  }>;
  const verificationSignals = JSON.parse(application.verificationSignals || '[]') as Array<{
    claim: string;
    status: 'Supported' | 'Partially Supported' | 'Not Sufficiently Supported' | 'Unable to Verify';
    details: string;
  }>;
  const interviewQuestions = JSON.parse(application.interviewQuestions || '[]') as Array<{
    category: string;
    question: string;
  }>;

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        {/* Navigation / Toolbar */}
        <div style={styles.toolbar} className="no-print">
          <Link href={`/hr/jobs/${application.jobId}`} style={styles.backLink}>
            <ChevronLeft size={16} /> Back to Job Dashboard
          </Link>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={styles.toolbarBtn}>
            <Printer size={14} /> Print / Export PDF
          </button>
        </div>

        {/* Candidate Title Info */}
        <div style={styles.headerCard} className="glass-panel">
          <div style={styles.headerInfo}>
            <span style={styles.metaLabel}>Applied For: {application.job.title}</span>
            <h1 style={styles.candidateName}>{application.applicant.name}</h1>
            <div style={styles.contactRow}>
              <span>📧 {application.applicant.email}</span>
              {application.applicant.phone && <span>📞 {application.applicant.phone}</span>}
              {application.applicant.location && <span>📍 {application.applicant.location}</span>}
            </div>
            
            {/* Social Links */}
            <div style={styles.socials} className="no-print">
              {application.applicant.githubUrl && (
                <a href={application.applicant.githubUrl} target="_blank" style={styles.socialLink} className="glass-panel">
                  <GitBranch size={16} /> GitHub Profile
                </a>
              )}
              {application.applicant.portfolioUrl && (
                <a href={application.applicant.portfolioUrl} target="_blank" style={styles.socialLink} className="glass-panel">
                  <LinkIcon size={16} /> Portfolio Website
                </a>
              )}
            </div>
          </div>

          {/* Scores Overview Column */}
          <div style={styles.scoresCol}>
            <div style={styles.scoreRowItem}>
              <span style={styles.scoreLabel}>Overall Match</span>
              <span className={`score-badge ${getScoreColorClass(application.jobMatchScore)}`} style={styles.badgeScoreBig}>
                {application.jobMatchScore}%
              </span>
            </div>
            
            <div style={styles.scoresGridMini}>
              <div style={styles.scoreMiniItem}>
                <span style={styles.scoreMiniLabel}>ATS</span>
                <span className={`score-badge ${getScoreColorClass(application.atsScore)}`} style={styles.badgeScoreMini}>
                  {application.atsScore}%
                </span>
              </div>
              <div style={styles.scoreMiniItem}>
                <span style={styles.scoreMiniLabel}>Portfolio</span>
                <span className={`score-badge ${getScoreColorClass(application.portfolioScore)}`} style={styles.badgeScoreMini}>
                  {application.portfolioScore}%
                </span>
              </div>
              <div style={styles.scoreMiniItem}>
                <span style={styles.scoreMiniLabel}>Evidence</span>
                <span className={`score-badge ${getScoreColorClass(application.technicalEvidenceScore)}`} style={styles.badgeScoreMini}>
                  {application.technicalEvidenceScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Grid Layout */}
        <div style={styles.detailGrid}>
          
          {/* LEFT SECTION: AI Findings & Citations */}
          <div style={styles.leftCol}>
            
            {/* Recruiter AI Summary */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.cardTitle}>
                <Award size={18} color="var(--accent-blue)" /> Recruiter AI Summary
              </h3>
              <p style={styles.summaryText}>{application.aiSummary || 'AI analysis pending.'}</p>
            </div>

            {/* Resume & Portfolio Claims Verification Engine */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.cardTitle}>
                <FolderDot size={18} color="var(--accent-purple)" /> Resume & Portfolio Verification Engine
              </h3>
              <p style={styles.sectionDescription}>
                Matches textual experience claims from resume/portfolio against actual repository files, database models, and server routers discovered in GitHub.
              </p>
              
              {verificationSignals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No code repository claims enqueued for verification.</p>
              ) : (
                <div style={styles.verificationList}>
                  {verificationSignals.map((sig, i) => (
                    <div key={i} style={styles.verificationItem} className="glass-panel">
                      <div style={styles.verificationHeader}>
                        <strong style={{ fontSize: '0.9rem' }}>{sig.claim}</strong>
                        <span className={`score-badge ${getVerificationStatusClass(sig.status)}`} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          {sig.status}
                        </span>
                      </div>
                      <p style={styles.verificationDetails}>🔍 {sig.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skill Matching & Citations */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.cardTitle}>
                <CheckCircle size={18} color="var(--match-excellent)" /> Skill Match Evidence Citations
              </h3>
              
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Skill</th>
                    <th style={{ ...styles.th, width: '130px' }}>Match Status</th>
                    <th style={styles.th}>Evidence Citations</th>
                  </tr>
                </thead>
                <tbody>
                  {skillsAnalysis.map((item, i) => (
                    <tr key={i} style={styles.tableRow}>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{item.skill}</td>
                      <td style={styles.td}>
                        <span className={`score-badge ${item.status === 'Strong Match' ? 'score-excellent' : (item.status === 'Partial Match' ? 'score-strong' : 'score-weak')}`} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT SECTION: Strengths, Gaps, Qs & Notes */}
          <div style={styles.rightCol}>
            
            {/* Recruiter Private Notes */}
            <div className="glass-panel no-print" style={styles.sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>
                  <FileText size={18} color="var(--accent-cyan)" /> Recruiter Private Notes
                </h3>
                <button
                  onClick={handleSaveNotes}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={savingNotes}
                >
                  <Save size={12} /> {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
              
              {notesSaved && <div style={{ fontSize: '0.8rem', color: 'var(--match-excellent)', marginBottom: '8px' }}>✓ Notes saved securely.</div>}

              <textarea
                style={styles.notesTextarea}
                placeholder="Write private recruiter notes here. These notes are organization-isolated and will never be shown to applicants."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Strengths & Gaps */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.cardTitle}>
                <TrendingUp size={18} color="var(--match-excellent)" /> Candidate Strengths
              </h3>
              <ul style={styles.bulletList}>
                {strengths.map((str, i) => (
                  <li key={i} style={styles.bulletItem}>
                    <span style={{ ...styles.bulletDot, color: 'var(--match-excellent)' }}>✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>

              <h3 style={{ ...styles.cardTitle, marginTop: '24px' }}>
                <AlertTriangle size={18} color="var(--match-review)" /> Skill Gap Recommendations
              </h3>
              {gaps.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No significant gaps identified for this role.</p>
              ) : (
                <div style={styles.gapList}>
                  {gaps.map((gap, i) => (
                    <div key={i} style={styles.gapItem}>
                      <div style={styles.gapHeader}>
                        <span style={styles.gapName}>{gap.skill}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Importance: {gap.importance}</span>
                      </div>
                      <p style={styles.gapRecommendation}>💡 {gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interview Recommendations */}
            <div className="glass-panel" style={styles.sectionCard}>
              <h3 style={styles.cardTitle}>
                <MessageSquareCode size={18} color="var(--accent-blue)" /> Suggested Interview Questions
              </h3>
              <p style={styles.sectionDescription}>
                Targeted evaluation questions formulated from resume gaps or claims to assist interviewers in confirming technical competencies.
              </p>

              {interviewQuestions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No verification questions generated.</p>
              ) : (
                <div style={styles.questionsList}>
                  {interviewQuestions.map((q, i) => (
                    <div key={i} style={styles.questionItem} className="glass-panel">
                      <span style={styles.questionCategory}>{q.category}</span>
                      <p style={styles.questionText}>" {q.question} "</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    '&:hover': {
      color: 'var(--text-primary)',
    },
  },
  toolbarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  headerCard: {
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '24px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(6, 182, 212, 0.03) 100%), var(--bg-card)',
  },
  headerInfo: {
    flex: 1,
    minWidth: '280px',
  },
  metaLabel: {
    fontSize: '0.8rem',
    color: 'var(--accent-cyan)',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  candidateName: {
    fontSize: '2.2rem',
    margin: '6px 0 10px 0',
    fontWeight: 800,
  },
  contactRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    flexWrap: 'wrap' as const,
  },
  socials: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  socialLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    background: 'rgba(255,255,255,0.02)',
  },
  scoresCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    minWidth: '220px',
  },
  scoreRowItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  scoreLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  badgeScoreBig: {
    fontSize: '2.2rem',
    padding: '8px 24px',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    borderRadius: 'var(--radius-md)',
  },
  scoresGridMini: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    width: '100%',
  },
  scoreMiniItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  scoreMiniLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  badgeScoreMini: {
    padding: '3px 8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    width: '100%',
    textAlign: 'center' as const,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    marginTop: '24px',
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
  sectionCard: {
    padding: '32px',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionDescription: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  summaryText: {
    fontSize: '0.95rem',
    lineHeight: '1.7',
    color: 'var(--text-secondary)',
  },
  verificationList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  verificationItem: {
    padding: '16px',
    background: 'rgba(255,255,255,0.01)',
  },
  verificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    gap: '12px',
    marginBottom: '6px',
  },
  verificationDetails: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
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
    padding: '10px 12px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
  },
  td: {
    padding: '12px',
    verticalAlign: 'top',
  },
  notesTextarea: {
    width: '100%',
    minHeight: '120px',
    background: 'rgba(13, 17, 39, 0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    padding: '12px',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-sans)',
    resize: 'vertical' as const,
    outline: 'none',
    '&:focus': {
      borderColor: 'var(--accent-indigo)',
    },
  },
  bulletList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  bulletItem: {
    display: 'flex',
    gap: '10px',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
  },
  bulletDot: {
    fontWeight: 'bold',
  },
  gapList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  gapItem: {
    borderLeft: '2px solid var(--match-review)',
    paddingLeft: '12px',
    paddingVertical: '4px',
  },
  gapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  gapName: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  gapRecommendation: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  questionItem: {
    padding: '16px',
    background: 'rgba(59, 130, 246, 0.02)',
    borderLeft: '2px solid var(--accent-blue)',
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
  },
  questionCategory: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--accent-indigo)',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
    letterSpacing: '0.05em',
  },
  questionText: {
    fontSize: '0.9rem',
    fontStyle: 'italic',
    lineHeight: '1.5',
    color: 'var(--text-primary)',
  },
};
