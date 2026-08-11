import ATSScoringService, { ATSBreakdown } from '@/services/scoring/ats';

describe('ATSScoringService', () => {
  const baseJobRequirements = {
    requiredSkills: [
      { skill: 'React', weight: 'high' },
      { skill: 'Node.js', weight: 'high' },
      { skill: 'TypeScript', weight: 'medium' },
      { skill: 'PostgreSQL', weight: 'medium' },
    ],
    preferredSkills: [
      { skill: 'Docker', weight: 'low' },
      { skill: 'AWS', weight: 'low' },
    ],
    experience: '3+ years',
    education: "Bachelor's degree in Computer Science",
  };

  const strongCandidate = {
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'Redis', 'GraphQL'],
    experience: [
      { title: 'Senior Developer', company: 'TechCo', period: '2019 - 2023', description: 'Built REST APIs with Node.js and React frontends.' },
      { title: 'Developer', company: 'StartupInc', period: '2017 - 2019', description: 'Developed microservices with Docker and AWS deployments.' },
    ],
    projects: [
      { name: 'E-commerce Platform', description: 'Full-stack React + Node.js app with PostgreSQL', technologies: ['React', 'Node.js', 'PostgreSQL'] },
      { name: 'Chat App', description: 'Real-time messaging with WebSockets', technologies: ['React', 'TypeScript', 'Redis'] },
    ],
    education: [
      { degree: "Bachelor's of Science in Computer Science", institution: 'MIT', year: '2017' },
    ],
  };

  const weakCandidate = {
    skills: ['Python', 'Django'],
    experience: [
      { title: 'Junior Developer', company: 'SmallCo', period: '2022 - 2023', description: 'Wrote Python scripts.' },
    ],
    projects: [],
    education: [],
  };

  test('should return a valid ATSBreakdown object', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    
    expect(result).toHaveProperty('atsScore');
    expect(result).toHaveProperty('skillMatch');
    expect(result).toHaveProperty('experienceMatch');
    expect(result).toHaveProperty('keywordRelevance');
    expect(result).toHaveProperty('projectRelevance');
    expect(result).toHaveProperty('educationScore');
    expect(result).toHaveProperty('resumeStructureScore');
    expect(result).toHaveProperty('explanations');
  });

  test('strong candidate should score higher than weak candidate', () => {
    const strongResult = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    const weakResult = ATSScoringService.calculateBreakdown(baseJobRequirements, weakCandidate);
    
    expect(strongResult.atsScore).toBeGreaterThan(weakResult.atsScore);
    expect(strongResult.skillMatch).toBeGreaterThan(weakResult.skillMatch);
  });

  test('strong candidate should have high skill match (all required skills present)', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    
    // All 4 required skills + 2 preferred skills are present
    expect(result.skillMatch).toBe(100);
  });

  test('weak candidate should have very low skill match (no required skills present)', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, weakCandidate);
    
    // 0 of 4 required, 0 of 2 preferred
    expect(result.skillMatch).toBeLessThanOrEqual(25);
  });

  test('experience score should be high when candidate exceeds requirements', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    
    // Strong candidate has ~6 years, requirement is 3+
    expect(result.experienceMatch).toBeGreaterThanOrEqual(90);
  });

  test('experience score should be lower when candidate has less than required', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, weakCandidate);
    
    // Weak candidate has ~1 year, requirement is 3+
    expect(result.experienceMatch).toBeLessThan(90);
  });

  test('resume structure score should be 100 when all sections are present', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    
    // Has skills, experience, education, projects
    expect(result.resumeStructureScore).toBe(100);
  });

  test('resume structure score should reflect missing sections', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, weakCandidate);
    
    // Missing: projects, education (has skills, experience)
    expect(result.resumeStructureScore).toBe(50);
  });

  test('overall ATS score should be between 0 and 100', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);

    const weakResult = ATSScoringService.calculateBreakdown(baseJobRequirements, weakCandidate);
    expect(weakResult.atsScore).toBeGreaterThanOrEqual(0);
    expect(weakResult.atsScore).toBeLessThanOrEqual(100);
  });

  test('explanations should contain detailed breakdown text for each category', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    
    expect(result.explanations.length).toBeGreaterThanOrEqual(5);
    expect(result.explanations.some(e => e.includes('Skill Match'))).toBe(true);
    expect(result.explanations.some(e => e.includes('Experience Match'))).toBe(true);
    expect(result.explanations.some(e => e.includes('Keyword Relevance'))).toBe(true);
    expect(result.explanations.some(e => e.includes('Project Relevance'))).toBe(true);
    expect(result.explanations.some(e => e.includes('Resume Structure'))).toBe(true);
  });

  test('should handle empty required skills gracefully', () => {
    const noSkillsReq = { ...baseJobRequirements, requiredSkills: [], preferredSkills: [] };
    const result = ATSScoringService.calculateBreakdown(noSkillsReq, strongCandidate);
    
    expect(result.skillMatch).toBe(50); // Default base score
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
  });

  test('project relevance should be higher when projects match required skills', () => {
    const result = ATSScoringService.calculateBreakdown(baseJobRequirements, strongCandidate);
    
    // Both projects include React, Node.js, PostgreSQL, TypeScript → high relevance
    expect(result.projectRelevance).toBeGreaterThanOrEqual(70);
  });

  test('PhD education requirement should score higher with PhD candidate', () => {
    const phdReq = { ...baseJobRequirements, education: 'PhD in Machine Learning' };
    
    const phdCandidate = {
      ...strongCandidate,
      education: [{ degree: 'PhD in Computer Science', institution: 'Stanford', year: '2020' }],
    };
    const bsCandidate = {
      ...strongCandidate,
      education: [{ degree: "Bachelor's in CS", institution: 'State Univ', year: '2018' }],
    };
    
    const phdResult = ATSScoringService.calculateBreakdown(phdReq, phdCandidate);
    const bsResult = ATSScoringService.calculateBreakdown(phdReq, bsCandidate);
    
    expect(phdResult.educationScore).toBeGreaterThan(bsResult.educationScore);
  });
});
