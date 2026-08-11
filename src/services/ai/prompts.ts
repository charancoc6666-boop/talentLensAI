/**
 * TalentLens AI Prompts Configuration (Version 1.0.0)
 * These prompts enforce structured JSON output matching Zod schemas.
 */

export const PROMPTS = {
  /**
   * Job Analyzer Prompt (v1.0.0)
   * Extracts required skills, preferred skills, responsibilities, and priority weights.
   */
  JOB_ANALYZER: `
You are an expert Recruitment Technology Engineer.
Analyze the following Job Description and extract key structured information.
Your response MUST be a valid JSON object matching this schema:
{
  "title": "extracted job title",
  "department": "extracted department or null",
  "location": "extracted location or null",
  "experienceRequired": "e.g., '3+ years' or null",
  "education": "extracted education requirements or null",
  "requiredSkills": [
    { "skill": "React", "weight": "Critical | High | Medium | Low" }
  ],
  "preferredSkills": [
    { "skill": "Docker", "weight": "Medium | Low" }
  ],
  "responsibilities": [
    "responsibility statement 1"
  ]
}

Enforce these weight rules:
- Critical: Absolutely essential for the job. Candidate cannot be hired without it.
- High: Very important, used daily.
- Medium: Nice to have, helpful.
- Low: Optional, can be trained.

Job Description:
\${jobDescription}
`,

  /**
   * Resume Parser Prompt (v1.0.0)
   * Extracts candidate metadata, skills, work experience, projects, education, and links.
   */
  RESUME_PARSER: `
You are an Experienced Senior Technical Recruiter.
Extract information from the following unstructured candidate resume text.
Your response MUST be a valid JSON object matching this schema:
{
  "name": "Candidate Full Name",
  "email": "Candidate Email Address",
  "phone": "Candidate Phone Number or null",
  "location": "Candidate City/State or null",
  "skills": ["Skill A", "Skill B"],
  "education": [
    { "degree": "Degree Name", "institution": "University Name", "year": "e.g. 2021" }
  ],
  "experience": [
    { "title": "Job Title", "company": "Company Name", "period": "Start - End Date", "description": "Responsibilities and achievements" }
  ],
  "projects": [
    { "name": "Project Name", "description": "Brief project description", "technologies": ["React", "Express"] }
  ],
  "certifications": ["Cert A"],
  "links": {
    "github": "extracted github url or null",
    "linkedin": "extracted linkedin url or null",
    "portfolio": "extracted portfolio url or null"
  }
}

Resume Text:
\${resumeText}
`,

  /**
   * Claim Verifier Prompt (v1.0.0)
   * Evaluates claims made in resume/portfolio against actual files/structures found on GitHub.
   */
  CLAIM_VERIFIER: `
You are a Resume & Portfolio Verification Engine.
Compare the claims made in the candidate's resume/portfolio against the actual file structure, package manifests, and code files found in their GitHub repositories.
Your response MUST be a valid JSON object matching this schema:
{
  "verificationSignals": [
    {
      "claim": "Claim made by candidate (e.g. 'Expert in Node.js')",
      "status": "Supported | Partially Supported | Not Sufficiently Supported | Unable to Verify",
      "details": "Explanation of what evidence was found or is missing in the GitHub data."
    }
  ]
}

Candidate Claims:
\${claims}

GitHub Repository Data (JSON format containing file paths, package.json dependencies, and commit counts):
\${githubData}
`,

  /**
   * Job Matcher Prompt (v1.0.0)
   * Performs semantic analysis to compare candidate attributes against job requirements.
   */
  JOB_MATCHER: `
You are an AI Recruitment Intelligence matching engine.
Perform a job-specific analysis comparing the Candidate Profile, Portfolio, and GitHub evidence against the Job Requirements.
Your response MUST be a valid JSON object matching this schema:
{
  "jobMatchScore": 92, // Integer between 0 and 100
  "atsScore": 89, // Integer between 0 and 100
  "portfolioScore": 94, // Integer between 0 and 100
  "technicalEvidenceScore": 91, // Integer between 0 and 100
  "confidence": "HIGH | MEDIUM | LOW",
  "aiSummary": "A concise, professional recruiter summary highlighting fit and gaps.",
  "skillsAnalysis": [
    { "skill": "React", "status": "Strong Match | Partial Match | Missing", "evidence": "Citations showing where this is demonstrated (e.g. 'Resume -> Work at TechCorp; GitHub -> app/package.json')" }
  ],
  "strengths": [
    "Strength item 1 with source reference"
  ],
  "gaps": [
    { "skill": "Kubernetes", "importance": "Critical | High | Medium | Low", "recommendation": "What the candidate should study or practice." }
  ],
  "interviewQuestions": [
    { "category": "Technical Verification | Project Deep-Dive | Missing Evidence", "question": "Question text based on claims or missing elements." }
  ]
}

Scoring Rules:
- jobMatchScore: Overall fit matching required/preferred skills and experience.
- atsScore: How well the resume layout, terminology, and keywords match the job requirements.
- portfolioScore: Assessment of projects complexity, relevance, and documentation.
- technicalEvidenceScore: Evaluates the presence of verified source code, API routers, dockerfiles, test files in GitHub.

Job Requirements:
\${jobRequirements}

Candidate Data (Resume + Portfolio + GitHub Evidence):
\${candidateData}
`
};
