/**
 * @package @tech-club/sandbox-contracts
 * Provider Trust, Identity, Security Posture, and Certification Framework
 */

import type { SandboxCapabilities } from "./types.js";

export type ProviderTrustTier =
  | "UNVERIFIED"
  | "SELF_ATTESTED"
  | "TCK_VERIFIED"
  | "CRYPTOGRAPHICALLY_CERTIFIED";

export type SecurityPostureGrade =
  | "A_HARDENED_MICROVM"
  | "B_ISOLATED_CONTAINER"
  | "C_RESTRICTED_PROCESS"
  | "F_UNCONFINED";

export interface ProviderIdentity {
  readonly providerId: string;
  readonly organization: string;
  readonly publicKeyHex: string;
  readonly endpointUrl?: string | undefined;
  readonly registeredAt: string;
}

export interface TckConformanceSummary {
  readonly tckSuiteVersion: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly executedAt: string;
  readonly tckEvidenceSha256: string;
}

export interface ProviderAttestation {
  readonly identity: ProviderIdentity;
  readonly declaredTrustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly tckSummary: TckConformanceSummary;
  readonly capabilities: SandboxCapabilities;
  readonly signatureHex: string;
}

export interface AttestationVerificationReport {
  readonly providerId: string;
  readonly isValid: boolean;
  readonly assignedTrustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly violations: readonly string[];
  readonly verifiedAt: string;
}

/**
 * Provider Trust Validator.
 * Audits provider attestation manifests, validates TCK test completion,
 * and determines eligibility for benchmark execution tiers.
 */
export class ProviderTrustValidator {
  verifyAttestation(attestation: ProviderAttestation): AttestationVerificationReport {
    const violations: string[] = [];

    // 1. Validate Identity
    if (!attestation.identity.providerId || attestation.identity.providerId.trim().length === 0) {
      violations.push("Provider ID is missing or empty.");
    }
    if (!attestation.identity.publicKeyHex || attestation.identity.publicKeyHex.length < 32) {
      violations.push("Invalid or missing public key format.");
    }

    // 2. Validate TCK pass rate
    const tck = attestation.tckSummary;
    if (tck.totalTests === 0) {
      violations.push("TCK suite reported zero tests executed.");
    }
    if (tck.failedTests > 0) {
      violations.push(`TCK conformance failed with ${tck.failedTests} failing tests.`);
    }

    // 3. Security posture alignment
    if (attestation.securityGrade === "F_UNCONFINED") {
      violations.push(
        "Unconfined security posture is not eligible for SemantIQ benchmark execution."
      );
    }

    // 4. Signature presence check
    if (!attestation.signatureHex || attestation.signatureHex.length < 64) {
      violations.push("Cryptographic signature is missing or malformed.");
    }

    const isValid = violations.length === 0;

    let assignedTrustTier: ProviderTrustTier = "UNVERIFIED";
    if (isValid) {
      if (tck.passedTests >= 10 && attestation.signatureHex) {
        assignedTrustTier = "CRYPTOGRAPHICALLY_CERTIFIED";
      } else if (tck.passedTests > 0) {
        assignedTrustTier = "TCK_VERIFIED";
      } else {
        assignedTrustTier = "SELF_ATTESTED";
      }
    }

    return {
      providerId: attestation.identity.providerId,
      isValid,
      assignedTrustTier,
      securityGrade: attestation.securityGrade,
      violations,
      verifiedAt: new Date().toISOString()
    };
  }
}
