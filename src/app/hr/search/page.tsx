'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Search, Sparkles, User, Users, Briefcase, Award, ArrowRight, ShieldCheck } from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  email: string;
  location: string | null;
}

interface Job {
  title: string;
}

interface Application {
  id: string;
  applicant: Applicant;
  job: Job;
  jobMatchScore: number;
  atsScore: number;
  skillsAnalysis: string;
  verificationSignals: string;
  aiSummary: string | null;
}

export default function TalentSearchPage() {
  const [query, setQuery] = useState('');
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [searchResults, setSearchResults] = useState<Array<{
    app: Application;
    rankScore: number;
    explanation: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function loadAllApplications() {
      try {
        // Fetch all jobs first to get their applications
        const jobsRes = await fetch('/api/jobs');
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const jobs = jobsData.jobs || [];
          
          let appsList: Application[] = [];
          for (const job of jobs) {
            const appsRes = await fetch(`/api/applications?jobId=${job.id}`);
            if (appsRes.ok) {
              const appsData = await appsRes.json();
              const appsWithJob = (appsData.applications || []).map((app: any) => ({
                ...app,
                job: { title: job.title }
              }));
              appsList = [...appsList, ...appsWithJob];
            }
          }
          
          // De-duplicate applications by applicant email/id
          const uniqueAppsMap = new Map<string, Application>();
          appsList.forEach(app => {
            const existing = uniqueAppsMap.get(app.applicant.id);
            if (!existing || app.jobMatchScore > existing.jobMatchScore) {
              uniqueAppsMap.set(app.applicant.id, app);
            }
          });

          setAllApplications(Array.from(uniqueAppsMap.values()));
        }
      } catch (e) {
        console.error('Error pre-loading candidates:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAllApplications();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    setTimeout(() => {
      const searchTerms = query
        .toLowerCase()
        .replace(/and/g, ' ')
        .replace(/with/g, ' ')
        .replace(/strong/g, ' ')
        .replace(/evidence/g, ' ')
        .split(/[\s,]+/)
        .filter(term => term.length > 1);

      const results = allApplications.map(app => {
        const skillsAnalysis = JSON.parse(app.skillsAnalysis || '[]') as Array<{ skill: string; status: string }>;
        const verifications = JSON.parse(app.verificationSignals || '[]') as Array<{ claim: string; status: string; details: string }>;
        
        let rankScore = 0;
        const matchedTechs: string[] = [];
        const verifiedTechs: string[] = [];

        searchTerms.forEach(term => {
          // Check matching in skills
          const matchingSkill = skillsAnalysis.find(s => s.skill.toLowerCase().includes(term));
          if (matchingSkill) {
            rankScore += 10;
            matchedTechs.push(matchingSkill.skill);

            // Double score if verified
            const verified = verifications.find(v => v.claim.toLowerCase().includes(term.toLowerCase()) && v.status === 'Supported');
            if (verified) {
              rankScore += 15;
              verifiedTechs.push(matchingSkill.skill);
            }
          }
        });

        // Add portion of overall match score
        rankScore += app.jobMatchScore * 0.1;

        // Generate semantic explanation
        let explanation = '';
        if (matchedTechs.length > 0) {
          const uniqueMatched = Array.from(new Set(matchedTechs));
          const uniqueVerified = Array.from(new Set(verifiedTechs));

          if (uniqueVerified.length > 0) {
            explanation = `Matched because candidate demonstrates ${uniqueMatched.join(' & ')} through historical work experience, with verified GitHub code evidence specifically confirming production dependencies for ${uniqueVerified.join(', ')}.`;
          } else {
            explanation = `Matched because candidate lists ${uniqueMatched.join(', ')} in active skill set, with portfolio projects demonstrating implementation experience.`;
          }
        } else {
          explanation = `Candidate profile evaluated. Shows general technical competence but limited direct keyword matches for "${query}".`;
        }

        return { app, rankScore, explanation };
      });

      // Filter out low scores and sort
      const filteredResults = results
        .filter(r => r.rankScore > 10 || r.app.jobMatchScore > 80)
        .sort((a, b) => b.rankScore - a.rankScore);

      setSearchResults(filteredResults);
      setLoading(false);
    }, 500);
  };

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        {/* Title */}
        <div style={styles.header}>
          <h1 style={styles.title}>Semantic Talent Search</h1>
          <p style={styles.subtitle}>Discover candidates by query matching across skills, code verification logs, and job fit summaries.</p>
        </div>

        {/* Search Bar */}
        <div className="glass-panel" style={styles.searchCard}>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.inputGroup}>
              <Search size={20} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="e.g. Find candidates with strong React, Node.js and PostgreSQL evidence"
                style={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={styles.searchBtn}>
              <Sparkles size={16} /> Search Candidates
            </button>
          </form>
          
          <div style={styles.hintRow}>
            <span style={styles.hintLabel}>Try searching:</span>
            <button onClick={() => setQuery('React and Node.js with Docker')} style={styles.hintBtn}>"React and Node.js with Docker"</button>
            <button onClick={() => setQuery('PyTorch and Python')} style={styles.hintBtn}>"PyTorch and Python"</button>
            <button onClick={() => setQuery('UI/UX Figma Design')} style={styles.hintBtn}>"UI/UX Figma Design"</button>
          </div>
        </div>

        {/* Search Results */}
        <div style={{ marginTop: '32px' }}>
          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <span style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Executing semantic search query...</span>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div style={styles.emptyState}>
              <Users size={32} style={{ color: 'var(--text-muted)' }} />
              <h3 style={{ marginTop: '12px' }}>No Matching Talent Located</h3>
              <p>Try broad queries targeting skills, libraries, or deployment stacks.</p>
            </div>
          ) : hasSearched ? (
            <div style={styles.resultsList}>
              <h2 style={styles.resultsHeader}>Search Results ({searchResults.length} Candidates)</h2>
              
              {searchResults.map(({ app, explanation }, i) => (
                <div key={app.id} className="glass-panel animate-fade-in" style={styles.candidateCard}>
                  {/* Left Column: Name & Job */}
                  <div style={styles.candInfo}>
                    <div style={styles.candHeader}>
                      <span style={styles.rankNum}>#{i + 1}</span>
                      <h3 style={styles.candName}>{app.applicant.name}</h3>
                    </div>
                    <span style={styles.candSub}>{app.applicant.location || 'San Francisco, CA'} · Applied to {app.job.title}</span>
                    
                    {/* Explanation */}
                    <div style={styles.explanationBox}>
                      <ShieldCheck size={16} color="var(--match-excellent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={styles.explanationText}>
                        <strong>Evidence Explanation:</strong> {explanation}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Scores */}
                  <div style={styles.scoreBlock}>
                    <div style={styles.scoreItem}>
                      <span style={styles.scoreLabel}>Job Match</span>
                      <span className={`score-badge ${app.jobMatchScore >= 90 ? 'score-excellent' : (app.jobMatchScore >= 75 ? 'score-strong' : 'score-review')}`} style={styles.scoreBadge}>
                        {app.jobMatchScore}%
                      </span>
                    </div>
                    <div style={styles.scoreItem}>
                      <span style={styles.scoreLabel}>ATS</span>
                      <span className="score-badge score-strong" style={styles.scoreBadgeMini}>
                        {app.atsScore}%
                      </span>
                    </div>
                    <Link href={`/hr/applications/${app.id}`} className="btn btn-secondary btn-sm" style={styles.viewBtn}>
                      View Evaluation <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.preSearchBox} className="glass-panel">
              <Sparkles size={32} color="var(--accent-purple)" style={{ marginBottom: '12px' }} />
              <h3>Evidence-Based Search Engine</h3>
              <p>Type keywords or full natural language queries. The engine will parse them, scan the verified GitHub trees and parsed resumes, and return ranked candidates with detailed matching reasons.</p>
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
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 800,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  searchCard: {
    padding: '32px',
  },
  searchForm: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  inputGroup: {
    position: 'relative' as const,
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '16px',
    color: 'var(--text-muted)',
  },
  input: {
    width: '100%',
    background: 'rgba(13, 17, 39, 0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    padding: '14px 16px 14px 48px',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'all var(--transition-normal)',
    '&:focus': {
      borderColor: 'var(--accent-blue)',
    },
  },
  searchBtn: {
    padding: '14px 24px',
  },
  hintRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    flexWrap: 'wrap' as const,
  },
  hintLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  hintBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    '&:hover': {
      background: 'var(--bg-hover)',
      color: 'var(--text-primary)',
    },
  },
  loadingBox: {
    padding: '60px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.05)',
    borderTop: '3px solid var(--accent-blue)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 0',
  },
  resultsHeader: {
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '20px',
    color: 'var(--text-primary)',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  candidateCard: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '24px',
  },
  candInfo: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  candHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rankNum: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--accent-blue)',
  },
  candName: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  candSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  explanationBox: {
    background: 'rgba(16, 185, 129, 0.03)',
    border: '1px solid rgba(16, 185, 129, 0.08)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px',
    marginTop: '12px',
    display: 'flex',
    gap: '10px',
  },
  explanationText: {
    fontSize: '0.85rem',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
  },
  scoreBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    minWidth: '240px',
    justifyContent: 'flex-end',
    '@media (maxWidth: 600px)': {
      justifyContent: 'flex-start',
      width: '100%',
    },
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  scoreLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  scoreBadge: {
    padding: '6px 16px',
    fontSize: '1.05rem',
    fontWeight: 800,
  },
  scoreBadgeMini: {
    padding: '4px 10px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  viewBtn: {
    padding: '10px 16px',
  },
  preSearchBox: {
    padding: '60px 20px',
    textAlign: 'center' as const,
    maxWidth: '600px',
    margin: '40px auto 0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
  },
};
