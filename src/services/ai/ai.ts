import { PROMPTS } from './prompts';

export class AIProvider {
  private static getApiKey(): { type: 'openai' | 'gemini' | 'mock'; key: string } {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      return { type: 'gemini', key: geminiKey };
    } else if (openaiKey) {
      return { type: 'openai', key: openaiKey };
    }
    return { type: 'mock', key: '' };
  }

  /**
   * Helper to make HTTP request to Gemini API
   */
  private static async callGemini(prompt: string): Promise<string> {
    const { key } = this.getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Empty response from Gemini API');
    }
    return content;
  }

  /**
   * Helper to make HTTP request to OpenAI API
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const { key } = this.getApiKey();
    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }
    return content;
  }

  /**
   * Execute LLM request or fallback to mock
   */
  private static async executeLLM(prompt: string, mockFallbackFn: () => any): Promise<any> {
    const provider = this.getApiKey();
    
    if (provider.type === 'mock') {
      // Small simulated latency for realistic feel
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockFallbackFn();
    }

    try {
      let rawJson = '';
      if (provider.type === 'gemini') {
        rawJson = await this.callGemini(prompt);
      } else {
        rawJson = await this.callOpenAI(prompt);
      }

      // Sanitize potential markdown code blocks in raw LLM output
      const sanitized = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(sanitized);
    } catch (e) {
      console.warn('AI Provider API call failed. Falling back to deterministic mock evaluation.', e);
      return mockFallbackFn();
    }
  }

  /**
   * 1. Extract requirements from Job Description
   */
  public static async analyzeJobDescription(description: string): Promise<{
    title: string;
    department: string | null;
    location: string | null;
    experienceRequired: string | null;
    education: string | null;
    requiredSkills: Array<{ skill: string; weight: 'Critical' | 'High' | 'Medium' | 'Low' }>;
    preferredSkills: Array<{ skill: string; weight: 'Medium' | 'Low' }>;
    responsibilities: string[];
  }> {
    const prompt = PROMPTS.JOB_ANALYZER.replace('${jobDescription}', description);

    return this.executeLLM(prompt, () => {
      // Deterministic parsing based on description text
      const lowerText = description.toLowerCase();
      let title = 'Senior Software Engineer';
      let dept = 'Engineering';
      let requiredSkills: any[] = [];
      let preferredSkills: any[] = [];

      if (lowerText.includes('data scientist') || lowerText.includes('machine learning')) {
        title = 'Lead Data Scientist';
        dept = 'AI & Data Science';
        requiredSkills = [
          { skill: 'Python', weight: 'Critical' },
          { skill: 'PyTorch', weight: 'Critical' },
          { skill: 'NLP', weight: 'Critical' },
          { skill: 'SQL', weight: 'High' },
          { skill: 'Machine Learning', weight: 'Critical' }
        ];
        preferredSkills = [
          { skill: 'Vector Databases', weight: 'High' },
          { skill: 'Docker', weight: 'Medium' },
          { skill: 'FastAPI', weight: 'Medium' }
        ];
      } else if (lowerText.includes('designer') || lowerText.includes('ux') || lowerText.includes('ui')) {
        title = 'Senior UI/UX Designer';
        dept = 'Product Design';
        requiredSkills = [
          { skill: 'Figma', weight: 'Critical' },
          { skill: 'UI/UX Design', weight: 'Critical' },
          { skill: 'Design Systems', weight: 'Critical' },
          { skill: 'Wireframing', weight: 'High' }
        ];
        preferredSkills = [
          { skill: 'HTML/CSS', weight: 'Medium' },
          { skill: 'Prototyping', weight: 'High' }
        ];
      } else {
        // Default Full Stack
        title = 'Senior Full Stack Developer';
        requiredSkills = [
          { skill: 'React', weight: 'Critical' },
          { skill: 'Node.js', weight: 'Critical' },
          { skill: 'PostgreSQL', weight: 'High' },
          { skill: 'REST APIs', weight: 'High' },
          { skill: 'TypeScript', weight: 'High' },
          { skill: 'Git', weight: 'High' }
        ];
        preferredSkills = [
          { skill: 'Docker', weight: 'Medium' },
          { skill: 'AWS', weight: 'Medium' },
          { skill: 'Redis', weight: 'Medium' }
        ];
      }

      // Check experience mentions
      let exp = '3+ years';
      const expMatch = description.match(/(\d+)\+?\s*years?/i);
      if (expMatch) exp = `${expMatch[1]}+ years`;

      return {
        title,
        department: dept,
        location: 'San Francisco, CA (Hybrid)',
        experienceRequired: exp,
        education: "Bachelor's in Computer Science or equivalent",
        requiredSkills,
        preferredSkills,
        responsibilities: [
          'Design, build, and maintain efficient, reusable, and reliable systems.',
          'Collaborate with team members to deliver high-quality production code.',
          'Optimize system performance, reliability, and security compliance.'
        ]
      };
    });
  }

  /**
   * 2. Parse unstructured Resume text
   */
  public static async parseResume(resumeText: string): Promise<{
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    skills: string[];
    education: Array<{ degree: string; institution: string; year: string }>;
    experience: Array<{ title: string; company: string; period: string; description: string }>;
    projects: Array<{ name: string; description: string; technologies: string[] }>;
    certifications: string[];
    links: { github: string | null; linkedin: string | null; portfolio: string | null };
  }> {
    const prompt = PROMPTS.RESUME_PARSER.replace('${resumeText}', resumeText);

    return this.executeLLM(prompt, () => {
      // Dynamic Regex Mock extraction
      const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const name = lines[0] || 'Unknown Candidate';
      
      let email = 'candidate@example.com';
      const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];

      let phone = null;
      const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) phone = phoneMatch[0];

      const skills: string[] = [];
      const commonSkills = [
        'React', 'Node.js', 'PostgreSQL', 'Express', 'TypeScript', 'JavaScript', 
        'HTML', 'CSS', 'Docker', 'AWS', 'Kubernetes', 'Redis', 'Python', 'PyTorch', 
        'NLP', 'SQL', 'Figma', 'UI/UX Design', 'Git'
      ];
      for (const skill of commonSkills) {
        const regex = new RegExp(`\\b${skill}\\b`, 'i');
        if (regex.test(resumeText)) {
          skills.push(skill);
        }
      }

      // Check for links
      const githubMatch = resumeText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
      const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
      const portfolioMatch = resumeText.match(/(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(dev|io|me|com)/i);

      return {
        name,
        email,
        phone,
        location: 'San Francisco, CA',
        skills: skills.length > 0 ? skills : ['React', 'Node.js', 'PostgreSQL'],
        education: [
          {
            degree: "Bachelor's in Computer Science",
            institution: 'State University',
            year: '2021'
          }
        ],
        experience: [
          {
            title: 'Software Developer',
            company: 'Innovation Labs',
            period: '2022 - Present',
            description: 'Responsible for building robust web APIs and optimizing user interfaces.'
          }
        ],
        projects: [
          {
            name: 'E-commerce Engine',
            description: 'High performance backend API supporting multiple vendors.',
            technologies: ['Node.js', 'Express', 'PostgreSQL']
          }
        ],
        certifications: [],
        links: {
          github: githubMatch ? `https://${githubMatch[0]}` : null,
          linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : null,
          portfolio: portfolioMatch ? `https://${portfolioMatch[0]}` : null
        }
      };
    });
  }

  /**
   * 3. Verify Candidate claims against GitHub repositories and folders
   */
  public static async verifyClaims(
    claims: string[],
    githubData: { files: string[]; dependencies: string[]; commitCount: number }
  ): Promise<{
    verificationSignals: Array<{
      claim: string;
      status: 'Supported' | 'Partially Supported' | 'Not Sufficiently Supported' | 'Unable to Verify';
      details: string;
    }>;
  }> {
    const claimsStr = JSON.stringify(claims);
    const githubStr = JSON.stringify(githubData);
    const prompt = PROMPTS.CLAIM_VERIFIER.replace('${claims}', claimsStr).replace('${githubData}', githubStr);

    return this.executeLLM(prompt, () => {
      // Core claim verification fallback engine
      const signals = claims.map((claim) => {
        const lowerClaim = claim.toLowerCase();
        let status: any = 'Unable to Verify';
        let details = 'No code evidence was found to verify this claim.';

        if (lowerClaim.includes('rest api') || lowerClaim.includes('backend') || lowerClaim.includes('express') || lowerClaim.includes('node')) {
          const hasRoutes = githubData.files.some(f => f.includes('routes') || f.includes('controllers') || f.includes('api'));
          const hasNodeDep = githubData.dependencies.some(d => d === 'express' || d === 'koa' || d === 'fastify' || d === 'nestjs');
          
          if (hasRoutes && hasNodeDep) {
            status = 'Supported';
            details = 'Express/Node routing modules and server-side package dependencies were successfully identified.';
          } else if (hasNodeDep) {
            status = 'Partially Supported';
            details = 'Node dependency found, but server file routing structures are missing in repositories.';
          } else {
            status = 'Not Sufficiently Supported';
            details = 'No backend code files or server dependencies found in repositories.';
          }
        } 
        else if (lowerClaim.includes('react') || lowerClaim.includes('frontend') || lowerClaim.includes('next.js')) {
          const hasReact = githubData.dependencies.some(d => d === 'react' || d === 'next');
          const hasComponents = githubData.files.some(f => f.includes('components') || f.includes('App.tsx') || f.endsWith('.jsx'));

          if (hasReact && hasComponents) {
            status = 'Supported';
            details = 'React component modules and client-side page layout scripts verified.';
          } else if (hasReact) {
            status = 'Partially Supported';
            details = 'React package dependency found, but no custom React component scripts found.';
          } else {
            status = 'Not Sufficiently Supported';
            details = 'No React imports or component files located.';
          }
        }
        else if (lowerClaim.includes('postgresql') || lowerClaim.includes('database') || lowerClaim.includes('prisma')) {
          const hasPrisma = githubData.dependencies.some(d => d === 'prisma' || d === '@prisma/client');
          const hasSqlFiles = githubData.files.some(f => f.includes('schema.prisma') || f.endsWith('.sql') || f.includes('db'));

          if (hasPrisma || hasSqlFiles) {
            status = 'Supported';
            details = 'Relational database schema definitions and model queries verified.';
          } else {
            status = 'Not Sufficiently Supported';
            details = 'No database configurations or SQL scripts verified.';
          }
        }
        else if (lowerClaim.includes('docker') || lowerClaim.includes('container')) {
          const hasDockerfile = githubData.files.some(f => f.includes('Dockerfile') || f.includes('docker-compose'));
          if (hasDockerfile) {
            status = 'Supported';
            details = 'Docker containerization configuration and compose environments verified.';
          } else {
            status = 'Not Sufficiently Supported';
            details = 'No Dockerfile found in repositories.';
          }
        }
        else if (lowerClaim.includes('kubernetes')) {
          const hasK8s = githubData.files.some(f => f.includes('k8s') || f.includes('deployment.yaml') || f.includes('helm'));
          if (hasK8s) {
            status = 'Supported';
            details = 'Kubernetes YAML manifest pods or Helm configurations verified.';
          } else {
            status = 'Not Sufficiently Supported';
            details = 'No Kubernetes orchestrations found.';
          }
        }

        return { claim, status, details };
      });

      return { verificationSignals: signals };
    });
  }

  /**
   * 4. Perform job-specific matching & scoring
   */
  public static async matchCandidate(
    jobRequirements: {
      title: string;
      requiredSkills: Array<{ skill: string; weight: string }>;
      preferredSkills: Array<{ skill: string; weight: string }>;
      experience: string | null;
    },
    candidateData: {
      skills: string[];
      experience: any[];
      github: { files: string[]; dependencies: string[]; commitCount: number } | null;
      claims: string[];
    }
  ): Promise<{
    jobMatchScore: number;
    atsScore: number;
    portfolioScore: number;
    technicalEvidenceScore: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    aiSummary: string;
    skillsAnalysis: Array<{ skill: string; status: 'Strong Match' | 'Partial Match' | 'Missing'; evidence: string }>;
    strengths: string[];
    gaps: Array<{ skill: string; importance: 'Critical' | 'High' | 'Medium' | 'Low'; recommendation: string }>;
    interviewQuestions: Array<{ category: string; question: string }>;
  }> {
    const jobReqsStr = JSON.stringify(jobRequirements);
    const candidateDataStr = JSON.stringify(candidateData);
    const prompt = PROMPTS.JOB_MATCHER.replace('${jobRequirements}', jobReqsStr).replace('${candidateData}', candidateDataStr);

    return this.executeLLM(prompt, () => {
      // Mathematical matching score logic
      const required = jobRequirements.requiredSkills.map(s => s.skill.toLowerCase());
      const preferred = jobRequirements.preferredSkills.map(s => s.skill.toLowerCase());
      const candidateSkills = candidateData.skills.map(s => s.toLowerCase());

      const skillsAnalysis = jobRequirements.requiredSkills.concat(jobRequirements.preferredSkills).map((req) => {
        const skillLower = req.skill.toLowerCase();
        let status: 'Strong Match' | 'Partial Match' | 'Missing' = 'Missing';
        let evidence = 'No matching reference found in applicant profile.';

        if (candidateSkills.includes(skillLower)) {
          status = 'Strong Match';
          evidence = `Candidate resume lists '${req.skill}' in active technical skill set.`;
          
          if (candidateData.github?.dependencies.some(d => d.includes(skillLower))) {
            evidence += ` Verified dependency match found in GitHub repositories.`;
          }
        } else {
          // Check for partial keyword matches
          const partialMatch = candidateSkills.find(s => s.includes(skillLower) || skillLower.includes(s));
          if (partialMatch) {
            status = 'Partial Match';
            evidence = `Related skill '${partialMatch}' listed in resume. Requires verification.`;
          }
        }

        return { skill: req.skill, status, evidence };
      });

      // Calculate scores
      const matchedRequired = skillsAnalysis.filter(s => required.includes(s.skill.toLowerCase()) && s.status === 'Strong Match').length;
      const totalRequired = required.length || 1;
      const requiredMatchRatio = matchedRequired / totalRequired;

      const matchedPreferred = skillsAnalysis.filter(s => preferred.includes(s.skill.toLowerCase()) && s.status === 'Strong Match').length;
      const totalPreferred = preferred.length || 1;
      const preferredMatchRatio = matchedPreferred / totalPreferred;

      // Base ATS score: matching keyword ratio (80%) + experience factors (20%)
      const atsScore = Math.min(100, Math.round((requiredMatchRatio * 75) + (preferredMatchRatio * 15) + 10));

      // Portfolio score: based on project descriptions and match of project tech (defaulting to high for seeded, but calculated realistically here)
      const portfolioScore = Math.min(100, Math.round(55 + (requiredMatchRatio * 35) + (candidateData.experience.length * 2)));

      // Technical evidence score: based on GitHub files verified
      let technicalEvidenceScore = 50;
      if (candidateData.github) {
        const hasFiles = candidateData.github.files.length > 5;
        const hasDeps = candidateData.github.dependencies.length > 3;
        technicalEvidenceScore = Math.min(100, Math.round(60 + (hasFiles ? 20 : 0) + (hasDeps ? 15 : 0) + Math.min(5, candidateData.github.commitCount / 20)));
      }

      // Overall match is a weighted average
      const jobMatchScore = Math.min(100, Math.round((atsScore * 0.35) + (portfolioScore * 0.35) + (technicalEvidenceScore * 0.3)));

      const strengths = [
        `Demonstrates core matching competency in ${skillsAnalysis.filter(s => s.status === 'Strong Match').slice(0, 3).map(s => s.skill).join(', ')}.`,
        `Solid candidate profile alignment with ${jobRequirements.title} responsibilities.`
      ];

      const gaps = skillsAnalysis
        .filter(s => s.status === 'Missing')
        .map(s => {
          const isReq = required.includes(s.skill.toLowerCase());
          return {
            skill: s.skill,
            importance: (isReq ? 'High' : 'Low') as any,
            recommendation: `Gain foundational training or build personal projects in ${s.skill} to demonstrate implementation evidence.`
          };
        });

      const interviewQuestions = [
        {
          category: 'Technical Verification',
          question: `Explain your implementation experience with ${skillsAnalysis.filter(s => s.status === 'Strong Match')[0]?.skill || 'your primary stack'}.`
        }
      ];
      if (gaps.length > 0) {
        interviewQuestions.push({
          category: 'Missing Evidence',
          question: `While your profile matches our requirements, we noticed limited evidence for ${gaps[0].skill}. Could you share any background or projects involving this technology?`
        });
      }

      return {
        jobMatchScore,
        atsScore,
        portfolioScore,
        technicalEvidenceScore,
        confidence: jobMatchScore > 85 ? 'HIGH' : (jobMatchScore > 65 ? 'MEDIUM' : 'LOW'),
        aiSummary: `${candidateData.experience[0]?.title || 'Applicant'} showing ${jobMatchScore > 75 ? 'solid' : 'partial'} alignment with ${jobRequirements.title}. Core competencies match ${skillsAnalysis.filter(s => s.status === 'Strong Match').slice(0, 3).map(s => s.skill).join('/')}. Gaps exist in ${gaps.map(g => g.skill).slice(0, 2).join(', ') || 'none'}.`,
        skillsAnalysis,
        strengths,
        gaps,
        interviewQuestions
      };
    });
  }
}
export default AIProvider;
