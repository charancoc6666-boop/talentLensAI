import AIProvider from '../ai/ai';
import { GitHubEvidence } from '../github/github';

export interface VerificationSignal {
  claim: string;
  status: 'Supported' | 'Partially Supported' | 'Not Sufficiently Supported' | 'Unable to Verify';
  details: string;
}

export class ClaimVerificationEngine {
  /**
   * Compare candidate claims against GitHub evidence to generate verification signals.
   */
  public static async verify(
    claims: string[],
    githubEvidence: GitHubEvidence
  ): Promise<VerificationSignal[]> {
    if (!claims || claims.length === 0) {
      return [];
    }

    try {
      const response = await AIProvider.verifyClaims(claims, githubEvidence);
      return response.verificationSignals || [];
    } catch (e) {
      console.error('ClaimVerificationEngine failed to parse via AI. Generating basic verification.', e);
      
      // Secondary fallback inside verifier for absolute robustness
      return claims.map((claim) => {
        const lowerClaim = claim.toLowerCase();
        let status: VerificationSignal['status'] = 'Unable to Verify';
        let details = 'Verification fell back to local offline rules due to server error.';

        if (lowerClaim.includes('react') && githubEvidence.dependencies.includes('react')) {
          status = 'Supported';
          details = 'Local check: found "react" dependency in GitHub evidence.';
        } else if (lowerClaim.includes('node') && githubEvidence.dependencies.includes('express')) {
          status = 'Supported';
          details = 'Local check: found "express" dependency in GitHub evidence.';
        }

        return { claim, status, details };
      });
    }
  }
}

export default ClaimVerificationEngine;
