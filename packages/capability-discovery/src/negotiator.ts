/**
 * @package @semantiq/capability-discovery
 * Capability Negotiator & Fallback Planner
 */

import type { EnvironmentSpec } from "../../sandbox-contracts/src/index.js";
import type { ProviderCapabilitiesManifest, CapabilityNegotiationResult } from "./types.js";

export class CapabilityNegotiator {
  negotiate(
    spec: EnvironmentSpec,
    manifests: readonly ProviderCapabilitiesManifest[]
  ): CapabilityNegotiationResult {
    const candidates: {
      manifest: ProviderCapabilitiesManifest;
      missing: string[];
      fallbacks: any[];
    }[] = [];

    for (const manifest of manifests) {
      const missing: string[] = [];
      const fallbacks: { feature: string; fallbackMechanism: string }[] = [];

      // Memory Check
      if (spec.resources.memoryLimitMebibytes > manifest.compute.maxMemoryMb) {
        missing.push(
          `memory: requested ${spec.resources.memoryLimitMebibytes}MB > max ${manifest.compute.maxMemoryMb}MB`
        );
      }

      // Network Policy Check
      if (spec.security.networkMode === "whitelisted_egress" && !manifest.network.egressWhitelist) {
        missing.push("network: whitelisted_egress not supported");
      }

      // Snapshot Check (Planned Fallback if missing)
      if (!manifest.stateManagement.nativeSnapshots) {
        fallbacks.push({
          feature: "stateManagement.nativeSnapshots",
          fallbackMechanism: "In-Memory Tar Volume Checkpoint Emulator"
        });
      }

      // Merkle Diff Check (Planned Fallback if missing)
      if (!manifest.stateManagement.filesystemMerkleDiff) {
        fallbacks.push({
          feature: "stateManagement.filesystemMerkleDiff",
          fallbackMechanism: "User-Space Merkle Directory Diff Scan"
        });
      }

      candidates.push({ manifest, missing, fallbacks });
    }

    // Find best compatible provider
    const valid = candidates.filter((c) => c.missing.length === 0);
    if (valid.length > 0) {
      const best = valid[0]!;
      return {
        isCompatible: true,
        selectedProviderId: best.manifest.providerId,
        missingMandatoryFeatures: [],
        activeFallbacks: best.fallbacks
      };
    }

    // Return first candidate with missing details
    const first = candidates[0];
    return {
      isCompatible: false,
      selectedProviderId: first?.manifest.providerId || "none",
      missingMandatoryFeatures: first?.missing || ["No providers available"],
      activeFallbacks: []
    };
  }
}
