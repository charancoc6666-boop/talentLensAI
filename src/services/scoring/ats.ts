export interface ATSBreakdown {
  atsScore: number;
  skillMatch: number;
  experienceMatch: number;
  keywordRelevance: number;
  projectRelevance: number;
  educationScore: number;
  resumeStructureScore: number;
  explanations: string[];
}

export class ATSScoringService {
  /**
   * Calculate a detailed ATS scoring breakdown based on candidate profile and job requirements.
   */
  public static calculateBreakdown(
    jobRequirements: {
      requiredSkills: Array<{ skill: string; weight: string }>;
      preferredSkills: Array<{ skill: string; weight: string }>;
      experience: string | null;
      education: string | null;
    },
    candidateData: {
      skills: string[];
      experience: Array<{ title: string; company: string; period: string; description: string }>;
      projects: Array<{ name: string; description: string; technologies: string[] }>;
      education: Array<{ degree: string; institution: string; year: string }>;
    }
  ): ATSBreakdown {
    const required = jobRequirements.requiredSkills.map(s => s.skill.toLowerCase());
    const preferred = jobRequirements.preferredSkills.map(s => s.skill.toLowerCase());
    const candidateSkills = candidateData.skills.map(s => s.toLowerCase());

    const explanations: string[] = [];

    // 1. Skill Match Score (40%)
    let skillMatch = 50; // base score
    if (required.length > 0) {
      const matchedRequired = required.filter(s => candidateSkills.includes(s)).length;
      const requiredRatio = matchedRequired / required.length;
      
      const matchedPreferred = preferred.filter(s => candidateSkills.includes(s)).length;
      const preferredRatio = preferred.length > 0 ? (matchedPreferred / preferred.length) : 1;

      skillMatch = Math.round((requiredRatio * 75) + (preferredRatio * 25));
      explanations.push(`Skill Match (${skillMatch}/100): Candidate demonstrates ${matchedRequired} of ${required.length} required skills, and ${matchedPreferred} of ${preferred.length} preferred skills.`);
    } else {
      explanations.push('Skill Match (50/100): No required skills defined for this job.');
    }

    // 2. Experience Match Score (20%)
    let experienceMatch = 70; // base score
    let requiredYears = 0;
    if (jobRequirements.experience) {
      const match = jobRequirements.experience.match(/(\d+)/);
      if (match) requiredYears = parseInt(match[1], 10);
    }

    // Sum candidate years of experience
    let candidateYears = 0;
    candidateData.experience.forEach(exp => {
      // Basic parse period (e.g. "2020 - 2023" or "3 years")
      const period = exp.period.toLowerCase();
      if (period.includes('year')) {
        const yrMatch = period.match(/(\d+)\s*year/);
        if (yrMatch) candidateYears += parseInt(yrMatch[1], 10);
      } else {
        const yearMatches = period.match(/\b(20\d{2})\b/g);
        if (yearMatches && yearMatches.length === 2) {
          candidateYears += parseInt(yearMatches[1], 10) - parseInt(yearMatches[0], 10);
        } else if (yearMatches && yearMatches.length === 1 && (period.includes('present') || period.includes('current'))) {
          candidateYears += new Date().getFullYear() - parseInt(yearMatches[0], 10);
        } else {
          candidateYears += 2; // Default estimation per job entry
        }
      }
    });
    
    // Ensure we count at least 1 year if they have experience entries
    if (candidateYears === 0 && candidateData.experience.length > 0) {
      candidateYears = candidateData.experience.length * 1.5;
    }

    if (requiredYears > 0) {
      if (candidateYears >= requiredYears) {
        experienceMatch = Math.min(100, Math.round(90 + (candidateYears - requiredYears) * 2));
        explanations.push(`Experience Match (${experienceMatch}/100): Candidate has ${candidateYears.toFixed(1)} years of experience, exceeding the required ${requiredYears} years.`);
      } else {
        experienceMatch = Math.max(30, Math.round((candidateYears / requiredYears) * 90));
        explanations.push(`Experience Match (${experienceMatch}/100): Candidate has ${candidateYears.toFixed(1)} years of experience, which is below the required ${requiredYears} years.`);
      }
    } else {
      experienceMatch = 85;
      explanations.push(`Experience Match (85/100): No specific years of experience required.`);
    }

    // 3. Keyword Relevance Score (15%)
    // Checks semantic alignment of resume text details
    let keywordRelevance = 60;
    let matchedKeywordsCount = 0;
    const technicalKeywords = [
      'api', 'rest', 'graphql', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 
      'postgres', 'mysql', 'mongodb', 'redis', 'prisma', 'ci/cd', 'github actions', 
      'testing', 'jest', 'cypress', 'ui/ux', 'figma', 'python', 'pytorch', 'ml', 'nlp'
    ];

    const resumeCorpus = (
      candidateData.skills.join(' ') + ' ' +
      candidateData.experience.map(e => e.title + ' ' + e.description).join(' ') + ' ' +
      candidateData.projects.map(p => p.name + ' ' + p.description).join(' ')
    ).toLowerCase();

    technicalKeywords.forEach(kw => {
      if (resumeCorpus.includes(kw)) matchedKeywordsCount++;
    });

    keywordRelevance = Math.min(100, Math.round(50 + (matchedKeywordsCount * 4)));
    explanations.push(`Keyword Relevance (${keywordRelevance}/100): Identified ${matchedKeywordsCount} core industry terms in candidate profile, showing strong alignment with developer terminology.`);

    // 4. Project Relevance Score (15%)
    let projectRelevance = 50;
    if (candidateData.projects.length > 0) {
      let relevantProjects = 0;
      candidateData.projects.forEach(proj => {
        const projText = (proj.name + ' ' + proj.description + ' ' + proj.technologies.join(' ')).toLowerCase();
        // Check if project references any required skills
        const hasSkillMatch = required.some(s => projText.includes(s));
        if (hasSkillMatch) relevantProjects++;
      });

      projectRelevance = Math.round((relevantProjects / candidateData.projects.length) * 100);
      projectRelevance = Math.max(40, Math.min(100, projectRelevance));
      explanations.push(`Project Relevance (${projectRelevance}/100): ${relevantProjects} of ${candidateData.projects.length} portfolio projects directly demonstrate technologies required for this role.`);
    } else {
      explanations.push('Project Relevance (40/100): No portfolio projects provided for technical verification.');
    }

    // 5. Education Match Score (5%)
    let educationScore = 70;
    const reqEd = jobRequirements.education?.toLowerCase() || '';
    const candidateDegrees = candidateData.education.map(e => e.degree.toLowerCase()).join(' ');

    if (reqEd.includes('phd') || reqEd.includes('doctor')) {
      if (candidateDegrees.includes('phd') || candidateDegrees.includes('doctor')) {
        educationScore = 100;
        explanations.push('Education Match (100/100): Candidate holds the preferred Doctoral degree.');
      } else if (candidateDegrees.includes('master')) {
        educationScore = 80;
        explanations.push('Education Match (80/100): Candidate holds a Master degree, partially satisfying PhD preference.');
      } else {
        educationScore = 60;
        explanations.push('Education Match (60/100): Candidate holds a Bachelor degree, which falls below PhD preference.');
      }
    } else if (reqEd.includes('master')) {
      if (candidateDegrees.includes('master') || candidateDegrees.includes('phd')) {
        educationScore = 100;
        explanations.push('Education Match (100/100): Candidate holds a Master or higher degree.');
      } else if (candidateDegrees.includes('bachelor')) {
        educationScore = 85;
        explanations.push('Education Match (85/100): Candidate holds a Bachelor degree, satisfying base requirements.');
      } else {
        educationScore = 60;
        explanations.push('Education Match (60/100): No advanced degrees found on candidate profile.');
      }
    } else {
      // Default: Bachelor's required or not specified
      if (candidateDegrees.includes('bachelor') || candidateDegrees.includes('master') || candidateDegrees.includes('phd') || candidateDegrees.includes('b.s') || candidateDegrees.includes('b.e')) {
        educationScore = 95;
        explanations.push('Education Match (95/100): Candidate holds a relevant university degree.');
      } else {
        educationScore = 75;
        explanations.push('Education Match (75/100): Self-taught or non-traditional background. Valued for evidence-based skills.');
      }
    }

    // 6. Resume Structure Score (5%)
    let sectionsFound = 0;
    if (candidateData.skills.length > 0) sectionsFound++;
    if (candidateData.experience.length > 0) sectionsFound++;
    if (candidateData.education.length > 0) sectionsFound++;
    if (candidateData.projects.length > 0) sectionsFound++;
    
    const resumeStructureScore = Math.round((sectionsFound / 4) * 100);
    explanations.push(`Resume Structure (${resumeStructureScore}/100): Profile contains ${sectionsFound} of 4 essential sections (Skills, Work Experience, Education, Projects).`);

    // Weighted Overall ATS Score
    const atsScore = Math.round(
      (skillMatch * 0.40) +
      (experienceMatch * 0.20) +
      (keywordRelevance * 0.15) +
      (projectRelevance * 0.15) +
      (educationScore * 0.05) +
      (resumeStructureScore * 0.05)
    );

    return {
      atsScore,
      skillMatch,
      experienceMatch,
      keywordRelevance,
      projectRelevance,
      educationScore,
      resumeStructureScore,
      explanations
    };
  }
}

export default ATSScoringService;
