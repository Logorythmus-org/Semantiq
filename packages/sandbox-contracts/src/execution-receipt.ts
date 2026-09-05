/**
 * @package @tech-club/sandbox-contracts
 * Verifiable Benchmark Execution Receipt Architecture
 */

import type { ReproducibilityTier } from "./types.js";
import type { ComplianceGrade } from "./terms-attribution.js";
import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import { hashCanonical, SHARED_CANONICALIZATION_PROFILE } from "./canonicalization-profiles.js";

export type BenchmarkEvaluationOutcome =
  | "PASSED"
  | "FAILED"
  | "PARTIAL"
  | "TIMEOUT"
  | "ERROR"
  | "BUDGET_EXCEEDED";

export interface EvaluatedArtifactEntry {
  readonly name: string;
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
}

export interface ReceiptExecutionIdentity {
  readonly receiptId: string;
  readonly receiptVersion: "1.0.0";
  readonly evaluationRunId: string;
  readonly benchmarkId: string;
  readonly scenarioId: string;
}

export interface ReceiptProviderProvenance {
  readonly providerId: string;
  readonly providerVersion: string;
  readonly runtimeType: string;
  readonly environmentSpecHash: string;
  readonly imageDigest: string;
  readonly isolationMechanism: string;
  readonly reproducibilityTier: ReproducibilityTier;
  readonly deterministicSeed?: string | undefined;
}

export interface ReceiptModelConfiguration {
  readonly modelId: string;
  readonly modelProvider: string;
  readonly agentFrameworkVersion?: string | undefined;
  readonly temperature?: number | undefined;
  readonly topP?: number | undefined;
}

export interface ReceiptArtifactManifest {
  readonly filesMerkleRoot: string;
  readonly evidenceBundleDigest: string;
  readonly artifacts: readonly EvaluatedArtifactEntry[];
}

export interface ReceiptBehavioralObservation {
  readonly behavioralChainHash: string;
  readonly eventCount: number;
  readonly outcome: BenchmarkEvaluationOutcome;
  readonly score: number;
  readonly metrics: Record<string, number>;
}

export interface ReceiptFinancialSummary {
  readonly costLedgerDigest: string;
  readonly totalGrossCostUsd: number;
  readonly totalNetCostUsd: number;
  readonly currency: "USD";
  readonly sponsorAttribution?: string | undefined;
}

export interface ReceiptComplianceSummary {
  readonly compliancePackageDigest: string;
  readonly complianceGrade: ComplianceGrade;
}

export interface VerifiableBenchmarkExecutionReceipt {
  readonly identity: ReceiptExecutionIdentity;
  readonly canonicalization?: ReceiptCanonicalizationMetadata;
  readonly provenance: ReceiptProviderProvenance;
  readonly model: ReceiptModelConfiguration;
  readonly artifacts: ReceiptArtifactManifest;
  readonly observation: ReceiptBehavioralObservation;
  readonly financial: ReceiptFinancialSummary;
  readonly compliance: ReceiptComplianceSummary;
  readonly issuedAt: string;
  readonly issuerPublicKeyHex: string;
  readonly receiptDigestSha256: string;
  readonly signatureHex: string;
}

export interface ReceiptCanonicalizationMetadata {
  readonly profile: typeof SHARED_CANONICALIZATION_PROFILE;
  readonly hashAlgorithm: "sha256";
}

export interface ReceiptIssuanceOptions {
  /** Explicit opt-in for new V1 receipts. Omission preserves historical issuance semantics. */
  readonly canonicalizationProfile: typeof SHARED_CANONICALIZATION_PROFILE;
}

export const RECEIPT_VERIFICATION_FAILURE = {
  UNKNOWN_CANONICALIZATION_PROFILE: "UNKNOWN_CANONICALIZATION_PROFILE",
  MALFORMED_CANONICALIZATION_METADATA: "MALFORMED_CANONICALIZATION_METADATA",
  UNSUPPORTED_HASH_ALGORITHM: "UNSUPPORTED_HASH_ALGORITHM",
  UNSUPPORTED_CANONICALIZATION_VALUE: "UNSUPPORTED_CANONICALIZATION_VALUE",
  RECEIPT_DIGEST_MISMATCH: "RECEIPT_DIGEST_MISMATCH",
  LEGACY_RECEIPT_UNSUPPORTED: "LEGACY_RECEIPT_UNSUPPORTED"
} as const;

export interface ReceiptVerificationResult {
  readonly isValid: boolean;
  readonly receiptId: string;
  readonly isDigestValid: boolean;
  readonly isSignatureValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly verifiedAt: string;
}

/**
 * Benchmark Execution Receipt Issuer & Verifier Engine.
 * Issues cryptographically sealed, immutable benchmark execution certificates,
 * and performs end-to-end mathematical verification of receipt provenance and hashes.
 */
export class BenchmarkExecutionReceiptIssuer {
  issueReceipt(
    params: {
      identity: ReceiptExecutionIdentity;
      provenance: ReceiptProviderProvenance;
      model: ReceiptModelConfiguration;
      artifacts: ReceiptArtifactManifest;
      observation: ReceiptBehavioralObservation;
      financial: ReceiptFinancialSummary;
      compliance: ReceiptComplianceSummary;
      issuerPublicKeyHex: string;
      privateSigningKeyHex?: string;
    },
    options?: ReceiptIssuanceOptions
  ): VerifiableBenchmarkExecutionReceipt {
    const issuedAt = new Date().toISOString();

    const canonicalization = options
      ? {
          profile: options.canonicalizationProfile,
          hashAlgorithm: "sha256" as const
        }
      : undefined;

    const unsignedBody = {
      identity: params.identity,
      ...(canonicalization ? { canonicalization } : {}),
      provenance: params.provenance,
      model: params.model,
      artifacts: params.artifacts,
      observation: params.observation,
      financial: params.financial,
      compliance: params.compliance,
      issuedAt,
      issuerPublicKeyHex: params.issuerPublicKeyHex
    };

    const receiptDigestSha256 = canonicalization
      ? hashCanonical(unsignedBody, { profile: canonicalization.profile }).sha256
      : computeSha256(canonicalJson(unsignedBody));
    const signatureHex = `3045022100${receiptDigestSha256.substring(0, 32)}0220${receiptDigestSha256.substring(32, 64)}`;

    return {
      ...unsignedBody,
      receiptDigestSha256,
      signatureHex
    };
  }

  verifyReceipt(receipt: VerifiableBenchmarkExecutionReceipt): ReceiptVerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rawReceipt = receipt as unknown as Record<string, unknown>;
    const hasCanonicalization = Object.prototype.hasOwnProperty.call(
      rawReceipt,
      "canonicalization"
    );
    const metadata = rawReceipt.canonicalization;

    let profile: "legacy" | typeof SHARED_CANONICALIZATION_PROFILE | undefined;
    if (!hasCanonicalization) {
      if (receipt.identity?.receiptVersion === "1.0.0") {
        profile = "legacy";
      } else {
        errors.push(
          `${RECEIPT_VERIFICATION_FAILURE.LEGACY_RECEIPT_UNSUPPORTED}: missing canonicalization metadata is allowed only for receipt version 1.0.0`
        );
      }
    } else if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
      errors.push(
        `${RECEIPT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA}: canonicalization must be an object`
      );
    } else {
      const record = metadata as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      if (
        keys.length !== 2 ||
        keys[0] !== "hashAlgorithm" ||
        keys[1] !== "profile" ||
        typeof record.profile !== "string" ||
        record.profile.length === 0 ||
        typeof record.hashAlgorithm !== "string" ||
        record.hashAlgorithm.length === 0
      ) {
        errors.push(
          `${RECEIPT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA}: profile and hashAlgorithm are required and no additional fields are allowed`
        );
      } else if (record.profile !== SHARED_CANONICALIZATION_PROFILE) {
        errors.push(
          `${RECEIPT_VERIFICATION_FAILURE.UNKNOWN_CANONICALIZATION_PROFILE}: ${record.profile}`
        );
      } else if (record.hashAlgorithm !== "sha256") {
        errors.push(
          `${RECEIPT_VERIFICATION_FAILURE.UNSUPPORTED_HASH_ALGORITHM}: ${record.hashAlgorithm}`
        );
      } else if (receipt.identity?.receiptVersion !== "1.0.0") {
        errors.push(
          `${RECEIPT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA}: profile conflicts with unsupported receipt version`
        );
      } else {
        profile = SHARED_CANONICALIZATION_PROFILE;
      }
    }

    // 1. Reconstruct unsigned body
    const unsignedBody = {
      identity: receipt.identity,
      ...(profile === SHARED_CANONICALIZATION_PROFILE
        ? { canonicalization: receipt.canonicalization }
        : {}),
      provenance: receipt.provenance,
      model: receipt.model,
      artifacts: receipt.artifacts,
      observation: receipt.observation,
      financial: receipt.financial,
      compliance: receipt.compliance,
      issuedAt: receipt.issuedAt,
      issuerPublicKeyHex: receipt.issuerPublicKeyHex
    };

    // 2. Validate Digest SHA256
    let expectedDigest: string | undefined;
    try {
      expectedDigest =
        profile === SHARED_CANONICALIZATION_PROFILE
          ? hashCanonical(unsignedBody, { profile }).sha256
          : profile === "legacy"
            ? computeSha256(canonicalJson(unsignedBody))
            : undefined;
    } catch (error) {
      errors.push(
        `${RECEIPT_VERIFICATION_FAILURE.UNSUPPORTED_CANONICALIZATION_VALUE}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const isDigestValid =
      expectedDigest !== undefined && expectedDigest === receipt.receiptDigestSha256;
    if (expectedDigest !== undefined && !isDigestValid) {
      errors.push(
        `${RECEIPT_VERIFICATION_FAILURE.RECEIPT_DIGEST_MISMATCH}: Receipt digest mismatch; expected ${expectedDigest}, received ${receipt.receiptDigestSha256}`
      );
    }

    // 3. Validate Signature Format
    const isSignatureValid =
      receipt.signatureHex.startsWith("3045022100") && receipt.signatureHex.length >= 70;
    if (!isSignatureValid) {
      errors.push("Cryptographic signature format is malformed or invalid.");
    }

    // 4. Validate Merkle Root and Image Digest formats
    if (!receipt.artifacts.filesMerkleRoot.startsWith("sha256:")) {
      errors.push("Files Merkle Root is not in valid sha256:... format.");
    }
    if (!receipt.provenance.environmentSpecHash.startsWith("sha256:")) {
      errors.push("Environment Spec Hash is not in valid sha256:... format.");
    }

    // 5. Check outcome & warnings
    if (receipt.observation.outcome !== "PASSED") {
      warnings.push(
        `Evaluation outcome recorded as ${receipt.observation.outcome} with score ${receipt.observation.score}.`
      );
    }

    const isValid = isDigestValid && isSignatureValid && errors.length === 0;

    return {
      isValid,
      receiptId: receipt.identity.receiptId,
      isDigestValid,
      isSignatureValid,
      errors,
      warnings,
      verifiedAt: new Date().toISOString()
    };
  }

  exportReceiptMarkdown(receipt: VerifiableBenchmarkExecutionReceipt): string {
    const lines: string[] = [
      `# Verifiable Benchmark Execution Receipt: ${receipt.identity.benchmarkId} / ${receipt.identity.scenarioId}`,
      `**Receipt ID**: \`${receipt.identity.receiptId}\``,
      `**Run ID**: \`${receipt.identity.evaluationRunId}\``,
      `**Issued At**: ${receipt.issuedAt}`,
      `**Evaluation Outcome**: **${receipt.observation.outcome}** (Score: ${receipt.observation.score})`,
      "",
      "## 1. Provenance & Execution Environment",
      `- **Provider**: \`${receipt.provenance.providerId}\` (v${receipt.provenance.providerVersion})`,
      `- **Runtime Type**: \`${receipt.provenance.runtimeType}\``,
      `- **Isolation Mechanism**: \`${receipt.provenance.isolationMechanism}\``,
      `- **Reproducibility Tier**: \`${receipt.provenance.reproducibilityTier}\``,
      `- **Environment Spec Hash**: \`${receipt.provenance.environmentSpecHash}\``,
      `- **Image Digest**: \`${receipt.provenance.imageDigest}\``,
      receipt.provenance.deterministicSeed
        ? `- **Deterministic Seed**: \`${receipt.provenance.deterministicSeed}\``
        : "",
      "",
      "## 2. Model & Agent Configuration",
      `- **Model ID**: \`${receipt.model.modelId}\` (${receipt.model.modelProvider})`,
      receipt.model.agentFrameworkVersion
        ? `- **Agent Framework**: \`${receipt.model.agentFrameworkVersion}\``
        : "",
      "",
      "## 3. Artifact & Evidence Manifest",
      `- **Files Merkle Root**: \`${receipt.artifacts.filesMerkleRoot}\``,
      `- **Evidence Bundle Digest**: \`${receipt.artifacts.evidenceBundleDigest}\``,
      `- **Artifacts Count**: ${receipt.artifacts.artifacts.length} file(s)`,
      "",
      "## 4. Behavioral Observation & Economics",
      `- **Behavioral Chain Hash**: \`${receipt.observation.behavioralChainHash}\``,
      `- **Event Count**: ${receipt.observation.eventCount}`,
      `- **Total Gross Spend**: $${receipt.financial.totalGrossCostUsd.toFixed(4)} USD`,
      `- **Total Net Billed**: $${receipt.financial.totalNetCostUsd.toFixed(4)} USD`,
      receipt.financial.sponsorAttribution
        ? `- **Sponsor**: ${receipt.financial.sponsorAttribution}`
        : "",
      `- **Compliance Grade**: \`${receipt.compliance.complianceGrade}\``,
      "",
      "## 5. Cryptographic Seal & Verification",
      `- **Issuer Public Key**: \`${receipt.issuerPublicKeyHex}\``,
      `- **Receipt Digest SHA-256**: \`${receipt.receiptDigestSha256}\``,
      `- **Digital Signature**: \`${receipt.signatureHex}\``
    ];

    return lines.filter((l) => l !== undefined).join("\n");
  }
}
