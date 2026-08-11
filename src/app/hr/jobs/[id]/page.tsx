'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Users,
  Search,
  Filter,
  FileText,
  UploadCloud,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Download,
  LayoutGrid,
  Columns,
  Grid,
  ArrowRight,
  BarChart2,
  Trash2
} from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  email: string;
  location: string | null;
}

interface Application {
  id: string;
  applicantId: string;
  applicant: Applicant;
  status: string;
  jobMatchScore: number;
  atsScore: number;
  portfolioScore: number;
  technicalEvidenceScore: number;
  confidence: string;
}

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  experience: string | null;
  salaryRange: string | null;
  requirements: string;
  preferredSkills: string;
}

interface BackgroundJob {
  id: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  errorMessage: string | null;
}

export default function JobDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: jobId } = use(params);

  // States
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'kanban' | 'upload' | 'reports'>('ranking');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Multi-select for comparison
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  
  // File Upload State
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressJobId, setUploadProgressJobId] = useState<string | null>(null);
  const [backgroundJobStatus, setBackgroundJobStatus] = useState<BackgroundJob | null>(null);
  const [progressTimer, setProgressTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
      }
    } catch (e) {
      console.error('Error fetching job details:', e);
    }
  };

  const fetchApplications = async () => {
    try {
      let url = `/api/applications?jobId=${jobId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.error('Error fetching applications:', e);
    }
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchJobDetails(), fetchApplications()]).finally(() => {
      setLoading(false);
    });
  }, [jobId, statusFilter, searchQuery]);

  // Background Job status polling
  useEffect(() => {
    if (!uploadProgressJobId) {
      if (progressTimer) {
        clearInterval(progressTimer);
        setProgressTimer(null);
      }
      return;
    }

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/applicants/queue/${uploadProgressJobId}`);
        if (res.ok) {
          const bgJob = await res.json();
          setBackgroundJobStatus(bgJob);
          
          if (bgJob.status === 'COMPLETED' || bgJob.status === 'FAILED') {
            // Stop polling
            setUploadProgressJobId(null);
            setUploadFiles([]);
            // Refresh applications list
            await fetchApplications();
          }
        }
      } catch (e) {
        console.error('Error polling queue:', e);
      }
    }, 2000);

    setProgressTimer(timer);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [uploadProgressJobId]);

  // Handle stage change via Kanban quick action
  const handleStageChange = async (appId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage })
      });
      if (res.ok) {
        await fetchApplications();
      }
    } catch (e) {
      console.error('Failed to update stage:', e);
    }
  };

  // Handle multi-file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files));
    }
  };

  // Handle Bulk Upload Form Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('jobId', jobId);
    uploadFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/applicants/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setUploadProgressJobId(data.jobId);
        setBackgroundJobStatus({
          id: data.jobId,
          status: 'QUEUED',
          totalItems: uploadFiles.length,
          completedItems: 0,
          failedItems: 0,
          errorMessage: null
        });
      } else {
        alert('File upload failed.');
      }
    } catch (e) {
      console.error('Error during upload:', e);
      alert('Error enqueuing resumes.');
    } finally {
      setUploading(false);
    }
  };

  // Checkbox select candidates
  const toggleCandidateSelection = (appId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-strong';
    if (score >= 60) return 'score-review';
    return 'score-weak';
  };

  if (loading && !job) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading job dashboard...</span>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div style={styles.container}>
          <h2>Job Posting Not Found</h2>
          <p>The job you are looking for does not exist or you do not have permission to view it.</p>
        </div>
      </>
    );
  }

  // Calculate Pipeline Funnel Stats
  const pipelineStats = {
    total: applications.length,
    new: applications.filter(a => a.status === 'NEW').length,
    screened: applications.filter(a => a.status === 'AI_SCREENED').length,
    review: applications.filter(a => a.status === 'REVIEW').length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    interview: applications.filter(a => a.status === 'INTERVIEW').length,
    offer: applications.filter(a => a.status === 'OFFER').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  // Kanban Columns
  const kanbanColumns = [
    { title: 'New', status: 'NEW' },
    { title: 'AI Screened', status: 'AI_SCREENED' },
    { title: 'Review', status: 'REVIEW' },
    { title: 'Shortlisted', status: 'SHORTLISTED' },
    { title: 'Interview', status: 'INTERVIEW' },
    { title: 'Offer', status: 'OFFER' },
    { title: 'Rejected', status: 'REJECTED' }
  ];

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        {/* Job Header */}
        <div style={styles.jobHeader} className="glass-panel">
          <div>
            <span style={styles.jobDept}>{job.department} · {job.location}</span>
            <h1 style={styles.jobTitle}>{job.title}</h1>
            <span style={styles.jobSalary}>{job.salaryRange}</span>
          </div>

          <div style={styles.headerStats}>
            <div style={styles.headerStatBox}>
              <span style={styles.headerStatVal}>{pipelineStats.total}</span>
              <span style={styles.headerStatLbl}>Applicants</span>
            </div>
            <div style={styles.headerStatBox}>
              <span style={{ ...styles.headerStatVal, color: 'var(--match-strong)' }}>
                {pipelineStats.shortlisted + pipelineStats.interview}
              </span>
              <span style={styles.headerStatLbl}>Shortlisted/Interview</span>
            </div>
            <div style={styles.headerStatBox}>
              <span style={{ ...styles.headerStatVal, color: 'var(--match-weak)' }}>{pipelineStats.rejected}</span>
              <span style={styles.headerStatLbl}>Rejected</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabsRow}>
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('ranking')}
              style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'ranking' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'ranking' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <ClipboardList size={16} /> Rankings & Search
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'kanban' ? 'var(--accent-purple)' : 'transparent', color: activeTab === 'kanban' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <Columns size={16} /> Kanban Pipeline
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'upload' ? 'var(--accent-cyan)' : 'transparent', color: activeTab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <UploadCloud size={16} /> Bulk Resume Upload
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'reports' ? 'var(--match-excellent)' : 'transparent', color: activeTab === 'reports' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <Download size={16} /> Reports & Analytics
            </button>
          </div>

          {activeTab === 'ranking' && selectedCandidates.length > 1 && (
            <Link
              href={`/hr/compare?jobId=${jobId}&ids=${selectedCandidates.join(',')}`}
              className="btn btn-primary btn-sm animate-fade-in"
            >
              Compare Selected ({selectedCandidates.length}) <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Tab Contents */}
        <div style={{ marginTop: '24px' }}>
          
          {/* TAB 1: Ranking Table */}
          {activeTab === 'ranking' && (
            <div className="glass-panel" style={styles.tabPanelCard}>
              <div style={styles.filterBar}>
                <div style={styles.searchWrapper}>
                  <Search size={16} style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by candidate name or location..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={styles.selectWrapper}>
                  <Filter size={14} style={styles.selectIcon} />
                  <select
                    style={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Stages</option>
                    <option value="NEW">New</option>
                    <option value="AI_SCREENED">AI Screened</option>
                    <option value="REVIEW">Review</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {applications.length === 0 ? (
                <div style={styles.emptyState}>
                  <Users size={32} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ marginTop: '12px' }}>No candidates found matching the filters.</p>
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={{ ...styles.th, width: '40px' }}>Select</th>
                      <th style={{ ...styles.th, width: '60px' }}>Rank</th>
                      <th style={styles.th}>Candidate Name</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Job Match %</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>ATS Score</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Portfolio Score</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Evidence Score</th>
                      <th style={styles.th}>Stage</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app, index) => (
                      <tr key={app.id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <input
                            type="checkbox"
                            style={styles.checkbox}
                            checked={selectedCandidates.includes(app.id)}
                            onChange={() => toggleCandidateSelection(app.id)}
                          />
                        </td>
                        <td style={{ ...styles.td, fontWeight: 'bold' }}>#{index + 1}</td>
                        <td style={styles.td}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{app.applicant.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.applicant.location || 'Unknown Location'}</div>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span className={`score-badge ${getScoreColorClass(app.jobMatchScore)}`} style={styles.scoreBadge}>
                            {app.jobMatchScore}%
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{app.atsScore}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{app.portfolioScore}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{app.technicalEvidenceScore}</td>
                        <td style={styles.td}>
                          <select
                            style={styles.stageSelect}
                            value={app.status}
                            onChange={(e) => handleStageChange(app.id, e.target.value)}
                          >
                            <option value="NEW">New</option>
                            <option value="AI_SCREENED">AI Screened</option>
                            <option value="REVIEW">Review</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <Link href={`/hr/applications/${app.id}`} className="btn btn-secondary btn-sm">
                            View Full Analysis
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: Kanban Pipeline */}
          {activeTab === 'kanban' && (
            <div style={styles.kanbanBoard}>
              {kanbanColumns.map((col) => {
                const colApps = applications.filter(a => a.status === col.status);
                return (
                  <div key={col.status} style={styles.kanbanCol} className="glass-panel">
                    <div style={styles.kanbanColHeader}>
                      <span style={styles.kanbanColTitle}>{col.title}</span>
                      <span style={styles.kanbanColCount}>{colApps.length}</span>
                    </div>

                    <div style={styles.kanbanColList}>
                      {colApps.length === 0 ? (
                        <div style={styles.kanbanEmptyCol}>Empty Column</div>
                      ) : (
                        colApps.map((app) => (
                          <div key={app.id} style={styles.kanbanCard} className="glass-panel animate-fade-in">
                            <div style={styles.kanbanCardName}>{app.applicant.name}</div>
                            
                            <div style={styles.kanbanCardMetrics}>
                              <div style={styles.kanbanCardMetricItem}>
                                <span style={styles.kLabel}>Match</span>
                                <span className={`score-badge ${getScoreColorClass(app.jobMatchScore)}`} style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                                  {app.jobMatchScore}%
                                </span>
                              </div>
                              <div style={styles.kanbanCardMetricItem}>
                                <span style={styles.kLabel}>ATS</span>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{app.atsScore}</span>
                              </div>
                            </div>

                            <div style={styles.kanbanCardFooter}>
                              <select
                                style={styles.kanbanStageSelector}
                                value={app.status}
                                onChange={(e) => handleStageChange(app.id, e.target.value)}
                              >
                                {kanbanColumns.map(c => (
                                  <option key={c.status} value={c.status}>{c.title}</option>
                                ))}
                              </select>
                              <Link href={`/hr/applications/${app.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                View
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Bulk Resume Upload */}
          {activeTab === 'upload' && (
            <div className="glass-panel" style={styles.tabPanelCard}>
              <h2 style={styles.panelTitle}>Resume Screening Queue</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                Upload multiple applicant resumes in PDF, DOCX, or TXT format. The screening processor executes asynchronously in the background.
              </p>

              <div style={styles.uploadLayout}>
                {/* Upload Form Box */}
                <div style={styles.uploadFormBox}>
                  <form onSubmit={handleUploadSubmit}>
                    <div style={styles.dropzone}>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                        id="dropzone-file"
                      />
                      <label htmlFor="dropzone-file" style={styles.dropzoneLabel}>
                        <UploadCloud size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Drag resumes here or click to browse</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports PDF, DOCX, TXT (Max 50 files)</span>
                      </label>
                    </div>

                    {uploadFiles.length > 0 && (
                      <div style={styles.fileListCard}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Selected Files ({uploadFiles.length})</h4>
                        <div style={styles.fileList}>
                          {uploadFiles.slice(0, 10).map((file, i) => (
                            <div key={i} style={styles.fileListItem}>
                              <FileText size={14} color="var(--accent-blue)" />
                              <span style={styles.fileListName}>{file.name}</span>
                              <span style={styles.fileListSize}>{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          ))}
                          {uploadFiles.length > 10 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '6px' }}>
                              And {uploadFiles.length - 10} more files...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', marginTop: '16px' }}
                      disabled={uploadFiles.length === 0 || uploading || !!uploadProgressJobId}
                    >
                      {uploading ? 'Uploading Resumes...' : 'Start Background Screening Pipeline'}
                    </button>
                  </form>
                </div>

                {/* Progress Status Box */}
                <div style={styles.progressBox}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Pipeline Status</h3>
                  
                  {backgroundJobStatus ? (
                    <div className="glass-panel" style={styles.progressBarCard}>
                      <div style={styles.progressHeader}>
                        <span style={styles.progressStatusBadge} className={backgroundJobStatus.status === 'COMPLETED' ? 'score-excellent' : (backgroundJobStatus.status === 'FAILED' ? 'score-weak' : 'score-strong')}>
                          {backgroundJobStatus.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Job ID: {backgroundJobStatus.id.slice(0, 8)}
                        </span>
                      </div>
                      
                      <div style={{ margin: '16px 0' }}>
                        <div style={styles.progressLabelRow}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Screening Progress</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {backgroundJobStatus.completedItems + backgroundJobStatus.failedItems} / {backgroundJobStatus.totalItems} Candidates
                          </span>
                        </div>
                        
                        <div style={styles.progressBarBg}>
                          <div
                            style={{
                              ...styles.progressBarFill,
                              width: `${((backgroundJobStatus.completedItems + backgroundJobStatus.failedItems) / (backgroundJobStatus.totalItems || 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div style={styles.progressStats}>
                        <div>
                          <span style={{ ...styles.progressStatVal, color: 'var(--match-excellent)' }}>{backgroundJobStatus.completedItems}</span>
                          <span style={styles.progressStatLbl}>Parsed & Matched</span>
                        </div>
                        <div>
                          <span style={{ ...styles.progressStatVal, color: 'var(--match-weak)' }}>{backgroundJobStatus.failedItems}</span>
                          <span style={styles.progressStatLbl}>Failures / Corrupt</span>
                        </div>
                      </div>

                      {backgroundJobStatus.errorMessage && (
                        <div style={styles.progressError}>
                          <AlertCircle size={14} />
                          <span>{backgroundJobStatus.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.progressIdle}>
                      <ClipboardList size={30} style={{ color: 'var(--text-muted)' }} />
                      <p style={{ marginTop: '10px' }}>No active background processing. Upload files to trigger the verifications engine.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Reports */}
          {activeTab === 'reports' && (
            <div className="glass-panel" style={styles.tabPanelCard}>
              <h2 style={styles.panelTitle}>Hiring Reports & Data Export</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.9rem' }}>
                Download structured audits and matches datasets for off-platform integrations or recruiting reviews.
              </p>

              <div style={styles.reportGrid}>
                {/* Comparison Report */}
                <div className="glass-panel" style={styles.reportCard}>
                  <div style={styles.reportIcon}>
                    <BarChart2 size={24} color="var(--accent-blue)" />
                  </div>
                  <h3 style={styles.reportTitle}>Candidate Comparison Report</h3>
                  <p style={styles.reportDesc}>
                    Lists all processed candidates ranked by match score, showing ATS breakdowns, verification claims, strengths, and gap analysis side-by-side.
                  </p>
                  <div style={styles.btnRow}>
                    <a
                      href={`/api/reports?jobId=${jobId}&format=csv&type=comparison`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={14} /> Export CSV
                    </a>
                    <a
                      href={`/api/reports?jobId=${jobId}&format=json&type=comparison`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={14} /> Export JSON
                    </a>
                  </div>
                </div>

                {/* Job Summary Report */}
                <div className="glass-panel" style={styles.reportCard}>
                  <div style={styles.reportIcon}>
                    <Users size={24} color="var(--accent-purple)" />
                  </div>
                  <h3 style={styles.reportTitle}>Job Hiring Analytics Report</h3>
                  <p style={styles.reportDesc}>
                    Includes aggregated statistics (total applicants, shortlisted rates, average scores, and skill frequency counts like "React: 72 candidates").
                  </p>
                  <div style={styles.btnRow}>
                    <a
                      href={`/api/reports?jobId=${jobId}&format=csv&type=job`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={14} /> Export CSV
                    </a>
                    <a
                      href={`/api/reports?jobId=${jobId}&format=json&type=job`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={14} /> Export JSON
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
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
  jobHeader: {
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '24px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%), var(--bg-card)',
  },
  jobDept: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  jobTitle: {
    fontSize: '2rem',
    margin: '6px 0',
    fontWeight: 800,
  },
  jobSalary: {
    fontSize: '0.95rem',
    color: 'var(--accent-cyan)',
    fontWeight: 600,
  },
  headerStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  headerStatBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 20px',
    minWidth: '120px',
    textAlign: 'center' as const,
  },
  headerStatVal: {
    display: 'block',
    fontSize: '1.6rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
  headerStatLbl: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    marginTop: '4px',
    display: 'block',
  },
  tabsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    marginTop: '32px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
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
    transition: 'all var(--transition-fast)',
  },
  tabPanelCard: {
    padding: '32px',
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  searchWrapper: {
    position: 'relative' as const,
    flex: 1,
    minWidth: '260px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    background: 'rgba(13, 17, 39, 0.5)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    padding: '10px 10px 10px 40px',
    fontSize: '0.9rem',
    width: '100%',
  },
  selectWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    minWidth: '160px',
  },
  selectIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  selectInput: {
    background: 'rgba(13, 17, 39, 0.5)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    padding: '10px 10px 10px 32px',
    fontSize: '0.9rem',
    width: '100%',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 0',
    color: 'var(--text-secondary)',
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
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.01)',
    },
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: 'var(--accent-blue)',
    cursor: 'pointer',
  },
  scoreBadge: {
    padding: '4px 12px',
    fontSize: '0.85rem',
  },
  stageSelect: {
    background: 'rgba(13, 17, 39, 0.7)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '6px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  // Kanban Styles
  kanbanBoard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 280px)',
    gap: '16px',
    overflowX: 'auto' as const,
    paddingBottom: '20px',
  },
  kanbanCol: {
    background: 'rgba(13, 17, 39, 0.4)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    minHeight: '500px',
  },
  kanbanColHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  kanbanColTitle: {
    fontWeight: 700,
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  },
  kanbanColCount: {
    fontSize: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontWeight: 'bold',
  },
  kanbanColList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    flex: 1,
  },
  kanbanEmptyCol: {
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    padding: '30px 0',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-sm)',
  },
  kanbanCard: {
    padding: '16px',
    background: 'var(--bg-card)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  kanbanCardName: {
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  kanbanCardMetrics: {
    display: 'flex',
    gap: '16px',
  },
  kanbanCardMetricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  kLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  kanbanCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '10px',
  },
  kanbanStageSelector: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    maxWidth: '120px',
  },
  // Upload Styles
  uploadLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    alignItems: 'start',
    '@media (maxWidth: 800px)': {
      gridTemplateColumns: '1fr',
    },
  },
  uploadFormBox: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  dropzone: {
    border: '2px dashed var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(13, 17, 39, 0.3)',
    padding: '40px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'all var(--transition-normal)',
    '&:hover': {
      borderColor: 'var(--accent-blue)',
      background: 'rgba(13, 17, 39, 0.5)',
    },
  },
  fileInput: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  dropzoneLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    cursor: 'pointer',
  },
  fileListCard: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    marginTop: '16px',
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  fileListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    padding: '6px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-sm)',
  },
  fileListName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  fileListSize: {
    color: 'var(--text-muted)',
  },
  progressBox: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  progressBarCard: {
    padding: '24px',
    background: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.05), transparent), var(--bg-card)',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  progressStatusBadge: {
    padding: '4px 10px',
    fontSize: '0.75rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 'bold',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'var(--accent-gradient)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.4s ease-out',
  },
  progressStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '16px',
    textAlign: 'center' as const,
  },
  progressStatVal: {
    display: 'block',
    fontSize: '1.4rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
  progressStatLbl: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    marginTop: '4px',
    display: 'block',
  },
  progressError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    marginTop: '16px',
  },
  progressIdle: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    border: '1px dashed var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  panelTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '10px',
  },
  // Reports page
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    '@media (maxWidth: 700px)': {
      gridTemplateColumns: '1fr',
    },
  },
  reportCard: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    alignItems: 'flex-start',
  },
  reportIcon: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
  },
  reportTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
  },
  reportDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    flex: 1,
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
};
