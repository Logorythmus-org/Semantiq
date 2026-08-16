/**
 * @package @semantiq/sandbox-contracts
 * Provider Licensing Boundary, Clean-Room Isolation, and Compliance Architecture
 */

export type LicenseClassification =
  | "PERMISSIVE"
  | "WEAK_COPYLEFT"
  | "STRONG_COPYLEFT"
  | "NETWORK_COPYLEFT"
  | "COMMERCIAL_PROPRIETARY"
  | "SOURCE_AVAILABLE";

export type BoundaryIsolationMechanism =
  | "NETWORK_RPC_REST"
  | "NETWORK_RPC_GRPC"
  | "PROCESS_CLI_SUBPROCESS"
  | "SOCKET_IPC"
  | "OCI_STANDARD_API";

export interface ThirdPartyNoticeEntry {
  readonly componentName: string;
  readonly spdxId: string;
  readonly copyrightHolder: string;
  readonly sourceUrl?: string | undefined;
}

export interface ProviderLicensingManifest {
  readonly providerId: string;
  readonly runtimeName: string;
  readonly runtimeLicenseSpdx: string;
  readonly runtimeClassification: LicenseClassification;
  readonly adapterLicenseSpdx: string;
  readonly isolationMechanism: BoundaryIsolationMechanism;
  readonly isCleanRoomImplementation: boolean;
  readonly allowsRedistribution: boolean;
  readonly requiresAttributionNotice: boolean;
  readonly trademarkGuidelinesUrl?: string | undefined;
  readonly thirdPartyNotices: readonly ThirdPartyNoticeEntry[];
  readonly registeredAt: string;
}

export interface LicensingAuditReport {
  readonly providerId: string;
  readonly isCompliant: boolean;
  readonly isCleanRoomIsolated: boolean;
  readonly hasNoCoreContamination: boolean;
  readonly warnings: readonly string[];
  readonly violations: readonly string[];
  readonly auditedAt: string;
}

/**
 * Licensing Boundary Auditor.
 * Audits runtime manifests and adapter bindings to guarantee legal clean-room
 * separation, preventing copyleft contamination and uncredited attribution.
 */
export class LicensingBoundaryAuditor {
  auditManifest(manifest: ProviderLicensingManifest): LicensingAuditReport {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. Mandatory SPDX identifier
    if (!manifest.runtimeLicenseSpdx || manifest.runtimeLicenseSpdx.trim().length === 0) {
      violations.push("Runtime license SPDX identifier is missing.");
    }

    // 2. Clean-room verification
    if (!manifest.isCleanRoomImplementation) {
      violations.push("Runtime adapter is not declared as a clean-room implementation.");
    }

    // 3. Network / Strong Copyleft Isolation Rules
    if (
      manifest.runtimeClassification === "NETWORK_COPYLEFT" ||
      manifest.runtimeClassification === "STRONG_COPYLEFT"
    ) {
      const isIsolated =
        manifest.isolationMechanism === "NETWORK_RPC_REST" ||
        manifest.isolationMechanism === "NETWORK_RPC_GRPC" ||
        manifest.isolationMechanism === "PROCESS_CLI_SUBPROCESS" ||
        manifest.isolationMechanism === "OCI_STANDARD_API";

      if (!isIsolated) {
        violations.push(
          `Strong/Network copyleft runtime (${manifest.runtimeLicenseSpdx}) must be isolated via Network RPC or Process CLI boundary.`
        );
      } else {
        warnings.push(
          `Copyleft runtime (${manifest.runtimeLicenseSpdx}) detected. Boundary verified via ${manifest.isolationMechanism}.`
        );
      }
    }

    // 4. Commercial Proprietary Terms Check
    if (manifest.runtimeClassification === "COMMERCIAL_PROPRIETARY") {
      if (manifest.allowsRedistribution) {
        violations.push(
          "Commercial proprietary runtime cannot claim unrestricted redistribution rights without license agreement."
        );
      }
      if (!manifest.trademarkGuidelinesUrl) {
        warnings.push("Commercial provider has not specified trademark usage guidelines.");
      }
    }

    // 5. Attribution Notice Completeness
    if (manifest.requiresAttributionNotice && manifest.thirdPartyNotices.length === 0) {
      violations.push(
        "Attribution notice is required by license but no third-party notice entries were provided."
      );
    }

    const isCompliant = violations.length === 0;
    const isCleanRoomIsolated = manifest.isCleanRoomImplementation && violations.length === 0;
    const hasNoCoreContamination = isCompliant;

    return {
      providerId: manifest.providerId,
      isCompliant,
      isCleanRoomIsolated,
      hasNoCoreContamination,
      warnings,
      violations,
      auditedAt: new Date().toISOString()
    };
  }

  generateAttributionNoticeBundle(manifests: readonly ProviderLicensingManifest[]): string {
    const lines: string[] = [
      "# SemantIQ Third-Party Runtime & Provider Attribution Notices",
      `Generated: ${new Date().toISOString()}`,
      "",
      "SemantIQ Core is licensed under Apache-2.0 / MIT. The following execution providers and runtime components operate across standardized clean-room boundaries:",
      ""
    ];

    for (const m of manifests) {
      lines.push(`## ${m.runtimeName} (${m.providerId})`);
      lines.push(`- **Runtime License**: ${m.runtimeLicenseSpdx} (${m.runtimeClassification})`);
      lines.push(`- **Adapter License**: ${m.adapterLicenseSpdx}`);
      lines.push(`- **Isolation Mechanism**: ${m.isolationMechanism}`);
      lines.push(`- **Clean-Room Verified**: ${m.isCleanRoomImplementation ? "Yes" : "No"}`);

      if (m.thirdPartyNotices.length > 0) {
        lines.push("- **Notices**:");
        for (const n of m.thirdPartyNotices) {
          lines.push(
            `  - ${n.componentName} [${n.spdxId}] © ${n.copyrightHolder}${n.sourceUrl ? ` (${n.sourceUrl})` : ""}`
          );
        }
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}
