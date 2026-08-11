/**
 * Tests for AI Service's deterministic mock/fallback logic.
 * These tests validate the offline resume parser, claim verification engine,
 * and job matching logic that runs when no API keys are configured.
 */
import { AIProvider } from '@/services/ai/ai';

// Ensure mock mode by not setting any API keys
delete process.env.OPENAI_API_KEY;
delete process.env.GEMINI_API_KEY;

describe('AIProvider - Mock/Offline Mode', () => {

  describe('parseResume', () => {
    const sampleResume = `
John Doe
john.doe@example.com
+1 (555) 123-4567

SKILLS
React, Node.js, TypeScript, PostgreSQL, Docker, AWS, Redis

EXPERIENCE
Senior Developer at TechCorp (2020 - 2024)
Built scalable REST APIs with Express and React frontends

PROJECTS
E-commerce Platform - Full-stack React + Node.js e-commerce system
Technologies: React, Node.js, PostgreSQL

EDUCATION
Bachelor's in Computer Science - MIT (2020)

LINKS
github.com/johndoe
linkedin.com/in/johndoe
`;

    test('should extract candidate name from first line', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.name).toBe('John Doe');
    });

    test('should extract email address via regex', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.email).toBe('john.doe@example.com');
    });

    test('should extract phone number via regex', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.phone).not.toBeNull();
    });

    test('should detect React, Node.js, TypeScript, PostgreSQL, Docker, AWS from resume text', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.skills).toContain('React');
      expect(result.skills).toContain('Node.js');
      expect(result.skills).toContain('TypeScript');
      expect(result.skills).toContain('PostgreSQL');
      expect(result.skills).toContain('Docker');
      expect(result.skills).toContain('AWS');
    });

    test('should extract GitHub link', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.links.github).toContain('github.com/johndoe');
    });

    test('should extract LinkedIn link', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.links.linkedin).toContain('linkedin.com/in/johndoe');
    });

    test('should return default skills when no known skills found', async () => {
      const bareResume = 'Jane Smith\njane@test.com\nSome unrecognized skills here.';
      const result = await AIProvider.parseResume(bareResume);
      expect(result.skills.length).toBeGreaterThan(0);
    });

    test('should include education, experience, and projects fields', async () => {
      const result = await AIProvider.parseResume(sampleResume);
      expect(result.education).toBeDefined();
      expect(result.education.length).toBeGreaterThan(0);
      expect(result.experience).toBeDefined();
      expect(result.experience.length).toBeGreaterThan(0);
      expect(result.projects).toBeDefined();
      expect(result.projects.length).toBeGreaterThan(0);
    });
  });

  describe('verifyClaims', () => {
    const githubDataWithEvidence = {
      files: ['src/routes/api.ts', 'src/components/App.tsx', 'prisma/schema.prisma', 'Dockerfile'],
      dependencies: ['express', 'react', 'next', '@prisma/client', 'prisma'],
      commitCount: 150,
    };

    const emptyGithubData = {
      files: [],
      dependencies: [],
      commitCount: 0,
    };

    test('should verify REST API claim when route files and express dependency exist', async () => {
      const result = await AIProvider.verifyClaims(
        ['Built REST API with Express backend'],
        githubDataWithEvidence
      );
      
      const signal = result.verificationSignals[0];
      expect(signal.status).toBe('Supported');
      expect(signal.details).toContain('Express');
    });

    test('should verify React claim when component files and react dependency exist', async () => {
      const result = await AIProvider.verifyClaims(
        ['Built React frontend components'],
        githubDataWithEvidence
      );
      
      const signal = result.verificationSignals[0];
      expect(signal.status).toBe('Supported');
    });

    test('should verify database claim when Prisma schema exists', async () => {
      const result = await AIProvider.verifyClaims(
        ['Designed PostgreSQL database schema with Prisma'],
        githubDataWithEvidence
      );
      
      const signal = result.verificationSignals[0];
      expect(signal.status).toBe('Supported');
    });

    test('should return "Unable to Verify" for claims with no matching code evidence', async () => {
      const result = await AIProvider.verifyClaims(
        ['Built REST API with Express backend'],
        emptyGithubData
      );
      
      const signal = result.verificationSignals[0];
      expect(['Not Sufficiently Supported', 'Unable to Verify']).toContain(signal.status);
    });

    test('should verify multiple claims in a single call', async () => {
      const result = await AIProvider.verifyClaims(
        [
          'Built REST API with Express',
          'Built React frontend',
          'Used PostgreSQL with Prisma',
        ],
        githubDataWithEvidence
      );
      
      expect(result.verificationSignals).toHaveLength(3);
      // All should be Supported given the evidence
      result.verificationSignals.forEach(sig => {
        expect(sig.status).toBe('Supported');
      });
    });
  });

  describe('analyzeJobDescription', () => {
    test('should detect full stack role keywords', async () => {
      const result = await AIProvider.analyzeJobDescription(
        'We are looking for a developer skilled in React, Node.js, and PostgreSQL with 3+ years experience.'
      );
      
      expect(result.title).toContain('Full Stack');
      expect(result.requiredSkills.length).toBeGreaterThan(0);
      expect(result.requiredSkills.some(s => s.skill === 'React')).toBe(true);
    });

    test('should detect data science role keywords', async () => {
      const result = await AIProvider.analyzeJobDescription(
        'Looking for a data scientist with strong machine learning experience in Python and PyTorch.'
      );
      
      expect(result.title).toContain('Data Scientist');
      expect(result.requiredSkills.some(s => s.skill === 'Python')).toBe(true);
      expect(result.requiredSkills.some(s => s.skill === 'PyTorch')).toBe(true);
    });

    test('should detect UI/UX designer role keywords', async () => {
      const result = await AIProvider.analyzeJobDescription(
        'Senior UI/UX designer needed with Figma expertise and design systems experience.'
      );
      
      expect(result.title).toContain('Designer');
      expect(result.requiredSkills.some(s => s.skill === 'Figma')).toBe(true);
    });

    test('should extract experience requirement from text', async () => {
      const result = await AIProvider.analyzeJobDescription(
        'We need a developer with 5+ years of experience in web development.'
      );
      
      expect(result.experienceRequired).toContain('5');
    });

    test('should return responsibilities array', async () => {
      const result = await AIProvider.analyzeJobDescription('Some developer job description');
      expect(result.responsibilities).toBeDefined();
      expect(Array.isArray(result.responsibilities)).toBe(true);
      expect(result.responsibilities.length).toBeGreaterThan(0);
    });
  });
});
