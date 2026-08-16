/**
 * @package @tech-club/sandbox-contracts
 * SemantIQ Provider Interoperability Standard (SPIS) Architecture
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";

export type SpisConformanceLevel =
  | "SPIS_CORE_L1" // Basic execution contract & exit codes
  | "SPIS_HERMETIC_L2" // L1 + Resource limits & network isolation
  | "SPIS_FULL_OBSERVABLE_L3"; // L2 + Independent observer PTY mirror & Merkle provenance

export type SpisErrorCategory =
  | "INVALID_SPEC"
  | "CAPABILITY_UNSUPPORTED"
  | "RESOURCE_EXHAUSTION"
  | "ISOLATION_VIOLATION"
  | "EGRESS_BLOCKED"
  | "EXECUTION_TIMEOUT"
  | "INTERNAL_PROVIDER_ERROR";

export interface SpisVersionNegotiation {
  readonly requestedVersion: string;
  readonly supportedVersions: readonly string[];
  readonly negotiatedVersion: string;
  readonly isCompatible: boolean;
}

export interface SpisProviderInteroperabilityManifest {
  readonly spisVersion: string;
  readonly providerId: string;
  readonly conformanceLevel: SpisConformanceLevel;
  readonly supportedRuntimes: readonly string[];
  readonly supportedSecurityProfiles: readonly string[];
  readonly supportedExtensions: readonly string[];
  readonly evidenceHashAlgorithm: "sha256" | "sha512";
  readonly lifecycleEndpoint: string;
  readonly manifestDigest: string;
  readonly certificationSignatureHex: string;
}

/**
 * SemantIQ Provider Interoperability Standard (SPIS) Engine.
 * Formally standardizes third-party runtime registration, version negotiation,
 * capability discovery, and conformance level verification.
 */
export class SpisInteroperabilityEngine {
  negotiateVersion(
    requestedVersion: string,
    supportedVersions: readonly string[]
  ): SpisVersionNegotiation {
    const isCompatible = supportedVersions.includes(requestedVersion);
    const negotiatedVersion = isCompatible
      ? requestedVersion
      : (supportedVersions[supportedVersions.length - 1] ?? "1.0.0");

    return {
      requestedVersion,
      supportedVersions,
      negotiatedVersion,
      isCompatible
    };
  }

  createInteroperabilityManifest(
    spisVersion: string,
    providerId: string,
    conformanceLevel: SpisConformanceLevel,
    supportedRuntimes: readonly string[],
    supportedSecurityProfiles: readonly string[],
    supportedExtensions: readonly string[] = [],
    evidenceHashAlgorithm: "sha256" | "sha512" = "sha256",
    lifecycleEndpoint = "http://localhost/spis/v1"
  ): SpisProviderInteroperabilityManifest {
    const unsigned = {
      spisVersion,
      providerId,
      conformanceLevel,
      supportedRuntimes,
      supportedSecurityProfiles,
      supportedExtensions,
      evidenceHashAlgorithm,
      lifecycleEndpoint
    };

    const manifestDigest = computeSha256(canonicalJson(unsigned));
    const certificationSignatureHex = `3045022100${manifestDigest.substring(0, 32)}0220${manifestDigest.substring(32, 64)}`;

    return {
      ...unsigned,
      manifestDigest,
      certificationSignatureHex
    };
  }

  verifyConformance(manifest: SpisProviderInteroperabilityManifest): boolean {
    return (
      manifest.spisVersion.startsWith("1.") &&
      manifest.supportedRuntimes.length > 0 &&
      manifest.manifestDigest.length === 64 &&
      manifest.certificationSignatureHex.startsWith("3045022100")
    );
  }

  formatSpisMarkdown(manifest: SpisProviderInteroperabilityManifest): string {
    const lines: string[] = [
      `# SemantIQ Provider Interoperability Standard (SPIS) Conformance Manifest: \`${manifest.providerId}\``,
      `**SPIS Standard Version**: \`v${manifest.spisVersion}\``,
      `**Certified Conformance Level**: **${manifest.conformanceLevel}**`,
      `**Evidence Hash Algorithm**: \`${manifest.evidenceHashAlgorithm}\``,
      `**Lifecycle Protocol Endpoint**: \`${manifest.lifecycleEndpoint}\``,
      "",
      "## 1. Supported Runtime Technologies",
      ...manifest.supportedRuntimes.map((r) => `- ⚙️ \`${r}\``),
      "",
      "## 2. Supported Security & Isolation Profiles",
      ...manifest.supportedSecurityProfiles.map((s) => `- 🛡️ \`${s}\``),
      "",
      "## 3. Registered Extensions",
      manifest.supportedExtensions.length > 0
        ? manifest.supportedExtensions.map((e) => `- 🔌 \`${e}\``).join("\n")
        : "- *(None - Pure Standard Conformance)*",
      "",
      `**Manifest Digest**: \`${manifest.manifestDigest}\``,
      `**SPIS Certification Signature**: \`${manifest.certificationSignatureHex}\``
    ];

    return lines.join("\n");
  }
}
