/**
 * @package @semantiq/evidence
 * Research Bundle Verifier and Tamper Detection Engine
 *
 * Invariants:
 * 1. Bundle integrity proves provenance/integrity, not truth.
 * 2. Deterministic cryptographic verification over all component hashes and Merkle root.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_BUNDLE_DISCLAIMER,
  type BundleVerificationResult,
  type ResearchBundleManifest
} from "./types.js";
import type { ResearchBundle } from "../../../sandbox-contracts/src/index.js";

export class ResearchBundleVerifier {
  /**
   * Cryptographically verifies the manifest and artifact payloads against tampering.
   */
  public verifyBundle(
    manifestOrBundle: ResearchBundleManifest | ResearchBundle,
    actualArtifacts?: ReadonlyMap<string, string> | Record<string, string> | undefined
  ): BundleVerificationResult {
    const violations: string[] = [];
    const missingArtifacts: string[] = [];
    const corruptedArtifacts: string[] = [];

    const isManifest = "componentArtifacts" in manifestOrBundle;
    const bundleId = isManifest
      ? (manifestOrBundle as ResearchBundleManifest).bundleId
      : (manifestOrBundle as ResearchBundle).id;
    const recordedMerkleRoot = manifestOrBundle.merkleRootHash;

    const recordedComponents = isManifest
      ? (manifestOrBundle as ResearchBundleManifest).componentArtifacts
      : (manifestOrBundle as ResearchBundle).includedArtifacts.map((a) => ({
          path: a.path,
          sha256: a.sha256,
          mediaType: a.mediaType,
          sizeBytes: 0,
          category: "runs" as const
        }));

    // 1. Check Merkle Root Hash Format
    if (!recordedMerkleRoot || recordedMerkleRoot.length !== 64) {
      violations.push(`Invalid or missing Merkle root hash on bundle ${bundleId}`);
    }

    // 2. Validate Component Hashes
    const verifiedHashes: string[] = [];
    const payloadMap = actualArtifacts
      ? actualArtifacts instanceof Map
        ? actualArtifacts
        : new Map(Object.entries(actualArtifacts))
      : undefined;

    for (const comp of recordedComponents) {
      if (payloadMap) {
        const payload = payloadMap.get(comp.path);
        if (payload === undefined) {
          missingArtifacts.push(comp.path);
          violations.push(`Missing artifact payload for path: '${comp.path}'`);
        } else {
          const computedHash = computeSha256(payload);
          if (computedHash !== comp.sha256) {
            corruptedArtifacts.push(comp.path);
            violations.push(
              `Tamper detected on '${comp.path}': computed hash ${computedHash} != expected ${comp.sha256}`
            );
          }
        }
      }
      verifiedHashes.push(`${comp.path}:${comp.sha256}`);
    }

    // 3. Recalculate Merkle Root
    const sortedHashes = [...verifiedHashes].sort();
    const computedMerkleRoot = computeSha256(sortedHashes.join("|"));
    const merkleRootValid = computedMerkleRoot === recordedMerkleRoot;

    if (!merkleRootValid) {
      violations.push(
        `Merkle root mismatch on bundle ${bundleId}: computed ${computedMerkleRoot} != recorded ${recordedMerkleRoot}`
      );
    }

    const tamperDetected =
      corruptedArtifacts.length > 0 || missingArtifacts.length > 0 || !merkleRootValid;
    const isValid = violations.length === 0 && !tamperDetected;

    const result: BundleVerificationResult = {
      isValid,
      bundleId,
      tamperDetected,
      merkleRootValid,
      verifiedArtifactCount: recordedComponents.length,
      missingArtifacts: Object.freeze(missingArtifacts),
      corruptedArtifacts: Object.freeze(corruptedArtifacts),
      violations: Object.freeze(violations),
      verifiedAt: new Date().toISOString(),
      epistemicDisclaimer: EPISTEMIC_BUNDLE_DISCLAIMER
    };

    return Object.freeze(result);
  }
}
