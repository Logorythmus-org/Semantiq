/**
 * @package @semantiq/evidence
 * Research Bundle Verifier and Tamper Detection Engine
 *
 * Invariants:
 * 1. Bundle integrity proves provenance/integrity, not truth.
 * 2. Deterministic cryptographic verification over all component hashes and Merkle root.
 */

import {
  canonicalizeV1,
  computeSha256,
  SHARED_CANONICALIZATION_PROFILE
} from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_BUNDLE_DISCLAIMER,
  type BundleVerificationResult,
  type ResearchBundleManifest
} from "./types.js";
import type { ResearchBundle } from "../../../sandbox-contracts/src/index.js";
import {
  hashWorkspaceComponentV1,
  WORKSPACE_COMPONENT_HASH_ALGORITHM,
  WORKSPACE_COMPONENT_VERIFICATION_FAILURE,
  WORKSPACE_SNAPSHOT_COMPONENT_PATH
} from "./workspace-component-canonicalization.js";

const PRODUCT_CONTRACT_ARTIFACT_VERSION = "1.0.0";

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

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
          category: "runs" as const,
          ...(hasOwn(a, "canonicalization") ? { canonicalization: a.canonicalization } : {})
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
      if (comp.path !== WORKSPACE_SNAPSHOT_COMPONENT_PATH && hasOwn(comp, "canonicalization")) {
        corruptedArtifacts.push(comp.path);
        violations.push(
          `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.LEGACY_COMPONENT_NOT_ELIGIBLE}: canonicalization metadata is supported only for '${WORKSPACE_SNAPSHOT_COMPONENT_PATH}', received '${comp.path}'`
        );
      }
      if (payloadMap) {
        const payload = payloadMap.get(comp.path);
        if (payload === undefined) {
          missingArtifacts.push(comp.path);
          violations.push(`Missing artifact payload for path: '${comp.path}'`);
        } else if (comp.path === WORKSPACE_SNAPSHOT_COMPONENT_PATH) {
          this.verifyWorkspaceComponent(
            manifestOrBundle.version,
            comp as unknown as Record<string, unknown>,
            payload,
            corruptedArtifacts,
            violations
          );
        } else if (!hasOwn(comp, "canonicalization")) {
          const computedHash = computeSha256(payload);
          if (computedHash !== comp.sha256) {
            corruptedArtifacts.push(comp.path);
            violations.push(
              `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.COMPONENT_DIGEST_MISMATCH}: Tamper detected on '${comp.path}': computed hash ${computedHash} != expected ${comp.sha256}`
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

  private verifyWorkspaceComponent(
    artifactVersion: string,
    component: Record<string, unknown>,
    payload: string,
    corruptedArtifacts: string[],
    violations: string[]
  ): void {
    const path = String(component.path);
    const expectedDigest = String(component.sha256);
    const hasCanonicalization = hasOwn(component, "canonicalization");

    if (artifactVersion !== PRODUCT_CONTRACT_ARTIFACT_VERSION) {
      corruptedArtifacts.push(path);
      violations.push(
        `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.LEGACY_COMPONENT_NOT_ELIGIBLE}: workspace component requires artifact version ${PRODUCT_CONTRACT_ARTIFACT_VERSION}`
      );
      return;
    }

    if (!hasCanonicalization) {
      const legacyDigest = computeSha256(payload);
      if (legacyDigest !== expectedDigest) {
        corruptedArtifacts.push(path);
        violations.push(
          `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.COMPONENT_DIGEST_MISMATCH}: legacy workspace digest mismatch; computed ${legacyDigest} != expected ${expectedDigest}`
        );
      }
      return;
    }

    const metadata = component.canonicalization;
    if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
      corruptedArtifacts.push(path);
      violations.push(
        `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA}: canonicalization must be an object`
      );
      return;
    }

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
      corruptedArtifacts.push(path);
      violations.push(
        `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.MALFORMED_CANONICALIZATION_METADATA}: profile and hashAlgorithm are required and no additional fields are allowed`
      );
      return;
    }
    if (record.profile !== SHARED_CANONICALIZATION_PROFILE) {
      corruptedArtifacts.push(path);
      violations.push(
        `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.UNKNOWN_CANONICALIZATION_PROFILE}: ${record.profile}`
      );
      return;
    }
    if (record.hashAlgorithm !== WORKSPACE_COMPONENT_HASH_ALGORITHM) {
      corruptedArtifacts.push(path);
      violations.push(
        `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.UNSUPPORTED_HASH_ALGORITHM}: ${record.hashAlgorithm}`
      );
      return;
    }

    try {
      const parsed = JSON.parse(payload) as import("./types.js").WorkspaceSnapshot;
      const canonicalPayload = canonicalizeV1(parsed);
      if (canonicalPayload !== payload) {
        corruptedArtifacts.push(path);
        violations.push(
          `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.PROFILE_DIGEST_BINDING_MISMATCH}: stored workspace payload is not exact V1 canonical UTF-8 text`
        );
        return;
      }
      const v1Digest = hashWorkspaceComponentV1(parsed).sha256;
      if (v1Digest !== expectedDigest) {
        corruptedArtifacts.push(path);
        violations.push(
          `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.PROFILE_DIGEST_BINDING_MISMATCH}: profile-bound workspace digest mismatch; computed ${v1Digest} != expected ${expectedDigest}`
        );
      }
    } catch (error) {
      corruptedArtifacts.push(path);
      violations.push(
        `${WORKSPACE_COMPONENT_VERIFICATION_FAILURE.PROFILE_DIGEST_BINDING_MISMATCH}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
