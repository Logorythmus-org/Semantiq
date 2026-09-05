/**
 * Profile-bound identity for the Core ResearchBundle workspace snapshot component.
 * The parent bundle root remains outside this canonicalization boundary.
 */

import {
  hashCanonical,
  SHARED_CANONICALIZATION_PROFILE
} from "../../../sandbox-contracts/src/index.js";
import type { WorkspaceSnapshot } from "./types.js";

export const WORKSPACE_SNAPSHOT_COMPONENT_PATH = "workspace/snapshot.json" as const;
export const WORKSPACE_COMPONENT_HASH_ALGORITHM = "sha256" as const;

export interface WorkspaceComponentCanonicalizationMetadata {
  readonly profile: typeof SHARED_CANONICALIZATION_PROFILE;
  readonly hashAlgorithm: typeof WORKSPACE_COMPONENT_HASH_ALGORITHM;
}

export const WORKSPACE_COMPONENT_VERIFICATION_FAILURE = {
  PROFILE_METADATA_REQUIRED: "PROFILE_METADATA_REQUIRED",
  PROFILE_DIGEST_BINDING_MISMATCH: "PROFILE_DIGEST_BINDING_MISMATCH",
  UNKNOWN_CANONICALIZATION_PROFILE: "UNKNOWN_CANONICALIZATION_PROFILE",
  MALFORMED_CANONICALIZATION_METADATA: "MALFORMED_CANONICALIZATION_METADATA",
  UNSUPPORTED_HASH_ALGORITHM: "UNSUPPORTED_HASH_ALGORITHM",
  LEGACY_COMPONENT_NOT_ELIGIBLE: "LEGACY_COMPONENT_NOT_ELIGIBLE",
  COMPONENT_DIGEST_MISMATCH: "COMPONENT_DIGEST_MISMATCH"
} as const;

export function createWorkspaceComponentV1IdentityPreimage(payload: WorkspaceSnapshot) {
  return {
    canonicalization: {
      profile: SHARED_CANONICALIZATION_PROFILE,
      hashAlgorithm: WORKSPACE_COMPONENT_HASH_ALGORITHM
    },
    componentPath: WORKSPACE_SNAPSHOT_COMPONENT_PATH,
    payload
  } as const;
}

export function hashWorkspaceComponentV1(payload: WorkspaceSnapshot) {
  return hashCanonical(createWorkspaceComponentV1IdentityPreimage(payload), {
    profile: SHARED_CANONICALIZATION_PROFILE
  });
}
