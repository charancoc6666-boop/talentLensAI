import { signToken, verifyToken, UserSession } from '@/lib/auth';

describe('Authentication Module', () => {
  const testSession: UserSession = {
    userId: 'test-user-id-001',
    email: 'recruiter@talentlens.ai',
    name: 'Test Recruiter',
    role: 'HR',
    orgId: 'test-org-id-001',
    orgRole: 'ADMIN',
  };

  const applicantSession: UserSession = {
    userId: 'test-applicant-id-001',
    email: 'applicant@email.com',
    name: 'Jane Doe',
    role: 'APPLICANT',
  };

  describe('signToken', () => {
    test('should generate a valid JWT string', () => {
      const token = signToken(testSession);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should generate different tokens for different sessions', () => {
      const token1 = signToken(testSession);
      const token2 = signToken(applicantSession);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    test('should verify and decode a valid token', () => {
      const token = signToken(testSession);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(testSession.userId);
      expect(decoded!.email).toBe(testSession.email);
      expect(decoded!.name).toBe(testSession.name);
      expect(decoded!.role).toBe('HR');
      expect(decoded!.orgId).toBe(testSession.orgId);
      expect(decoded!.orgRole).toBe('ADMIN');
    });

    test('should verify applicant session correctly', () => {
      const token = signToken(applicantSession);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded!.role).toBe('APPLICANT');
      expect(decoded!.orgId).toBeUndefined();
    });

    test('should return null for an invalid token', () => {
      const decoded = verifyToken('invalid.jwt.token');
      expect(decoded).toBeNull();
    });

    test('should return null for an empty string', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });

    test('should return null for a tampered token', () => {
      const token = signToken(testSession);
      // Tamper with the payload
      const parts = token.split('.');
      parts[1] = parts[1] + 'tampered';
      const tamperedToken = parts.join('.');
      
      const decoded = verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });
  });

  describe('Session Roundtrip', () => {
    test('sign → verify preserves all session fields', () => {
      const fullSession: UserSession = {
        userId: 'roundtrip-test',
        email: 'roundtrip@test.com',
        name: 'Roundtrip User',
        role: 'HR',
        orgId: 'org-123',
        orgRole: 'RECRUITER',
      };

      const token = signToken(fullSession);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(fullSession.userId);
      expect(decoded!.email).toBe(fullSession.email);
      expect(decoded!.name).toBe(fullSession.name);
      expect(decoded!.role).toBe(fullSession.role);
      expect(decoded!.orgId).toBe(fullSession.orgId);
      expect(decoded!.orgRole).toBe(fullSession.orgRole);
    });

    test('token should contain expiry (iat/exp claims)', () => {
      const token = signToken(testSession);
      const decoded = verifyToken(token) as any;
      
      expect(decoded).not.toBeNull();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });
});
