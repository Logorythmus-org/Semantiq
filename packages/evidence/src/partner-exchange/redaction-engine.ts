/**
 * @package @semantiq/evidence
 * Exchange Redaction Engine
 * 
 * Invariants:
 * 1. Strips private tokens, secrets, internal IPs from exchange bundles.
 * 2. Computes new deterministic SHA-256 digests for redacted artifacts.
 * 3. Package integrity proves provenance/integrity, not truth.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_REPLICATION_DISCLAIMER,
  type PartnerStudy,
  type RedactedArtifactEntry,
  type RedactedExchangePackage
} from "./types.js";

const SECRET_PATTERNS = [
  /(?:api[_-]?key|secret|token|password|bearer\s+)["']?\s*[:=]\s*["']?([a-zA-Z0-9_\-]{16,})/gi,
  /sk-[a-zA-Z0-9]{20,}/g,
  /ghp_[a-zA-Z0-9]{20,}/g
];

const IP_PATTERNS = [
  /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g
];

export interface RedactPackageOptions {
  readonly packageId?: string | undefined;
  readonly sourceOrganizationId: string;
  readonly targetOrganizationId?: string | undefined;
  readonly study: PartnerStudy;
  readonly rawArtifacts: ReadonlyMap<string, string> | Record<string, string>;
  readonly stripTokens?: boolean | undefined;
  readonly redactInternalIps?: boolean | undefined;
}

export interface RedactedPackageResult {
  readonly exchangePackage: RedactedExchangePackage;
  readonly redactedArtifactsMap: ReadonlyMap<string, string>;
}

export class ExchangeRedactionEngine {
  public redactBundleForExchange(options: RedactPackageOptions): RedactedPackageResult {
    const packageId =
      options.packageId ??
      `pkg_${computeSha256(`${options.sourceOrganizationId}:${options.study.id}:${Date.now()}`).slice(0, 16)}`;
    const stripTokens = options.stripTokens ?? true;
    const redactIps = options.redactInternalIps ?? true;

    const rawMap =
      options.rawArtifacts instanceof Map
        ? options.rawArtifacts
        : new Map(Object.entries(options.rawArtifacts));

    const rulesApplied: string[] = [];
    if (stripTokens) rulesApplied.push("strip_secret_tokens");
    if (redactIps) rulesApplied.push("redact_internal_ips");

    const redactedMap = new Map<string, string>();
    const artifactEntries: RedactedArtifactEntry[] = [];

    for (const [path, originalContent] of rawMap.entries()) {
      let content = originalContent;
      let isRedacted = false;

      if (stripTokens) {
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(content)) {
            content = content.replace(pattern, "[REDACTED_SECRET]");
            isRedacted = true;
          }
        }
      }

      if (redactIps) {
        for (const pattern of IP_PATTERNS) {
          if (pattern.test(content)) {
            content = content.replace(pattern, "[REDACTED_IP]");
            isRedacted = true;
          }
        }
      }

      const originalSizeBytes = Buffer.byteLength(originalContent, "utf8");
      const redactedSizeBytes = Buffer.byteLength(content, "utf8");
      const sha256 = computeSha256(content);

      redactedMap.set(path, content);
      artifactEntries.push({
        path,
        sha256,
        isRedacted,
        originalSizeBytes,
        redactedSizeBytes
      });
    }

    const sortedHashes = artifactEntries.map((a) => `${a.path}:${a.sha256}`).sort();
    const packageMerkleHash = computeSha256(sortedHashes.join("|"));

    const exchangePackage: RedactedExchangePackage = {
      packageId,
      sourceOrganizationId: options.sourceOrganizationId,
      targetOrganizationId: options.targetOrganizationId,
      study: options.study,
      redactedArtifacts: Object.freeze(artifactEntries),
      redactionRulesApplied: Object.freeze(rulesApplied),
      packageMerkleHash,
      exportedAt: new Date().toISOString(),
      epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
    };

    return {
      exchangePackage: Object.freeze(exchangePackage),
      redactedArtifactsMap: redactedMap
    };
  }
}
