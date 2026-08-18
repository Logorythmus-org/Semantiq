/**
 * @package @semantiq/evidence
 * Workspace Snapshot Engine
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type {
  SoftwareFingerprints,
  WorkspaceSnapshot
} from "./types.js";

export interface CreateWorkspaceSnapshotOptions {
  readonly workspaceName: string;
  readonly activePackages?: readonly string[] | undefined;
  readonly activeProfilesCount?: number | undefined;
  readonly activeRunsCount?: number | undefined;
  readonly activeEvaluationsCount?: number | undefined;
  readonly deterministicSeed?: number | undefined;
  readonly toolchainVersion?: string | undefined;
  readonly packages?: Record<string, string> | undefined;
}

export class WorkspaceSnapshotEngine {
  /**
   * Generates an immutable snapshot of current workspace and software environment.
   */
  public createSnapshot(options: CreateWorkspaceSnapshotOptions): WorkspaceSnapshot {
    const seed = options.deterministicSeed ?? 42;
    const toolchainVersion = options.toolchainVersion ?? "1.0.0";
    const packages = options.packages ?? {
      "@tech-club/sandbox-contracts": "1.0.0",
      "@tech-club/semantiq": "1.0.0",
      "@semantiq/evidence": "1.0.0",
      "@semantiq/patterns": "1.0.0"
    };

    const envPayload = `node:${process.version}:${process.platform}:${process.arch}:seed=${seed}:v=${toolchainVersion}`;
    const environmentFingerprint = computeSha256(envPayload);

    const softwareFingerprints: SoftwareFingerprints = {
      runtime: `Node.js ${process.version}`,
      platform: `${process.platform} ${process.arch}`,
      toolchainVersion,
      deterministicSeed: seed,
      packages: Object.freeze({ ...packages }),
      environmentFingerprint
    };

    const snapshotId = `ws_snap_${computeSha256(`${options.workspaceName}:${environmentFingerprint}`).slice(0, 16)}`;
    const capturedAt = new Date().toISOString();

    const snapshotDigest = computeSha256(
      `${snapshotId}:${options.workspaceName}:${capturedAt}:${environmentFingerprint}:${options.activeRunsCount ?? 0}:${options.activeEvaluationsCount ?? 0}`
    );

    const snapshot: WorkspaceSnapshot = {
      snapshotId,
      workspaceName: options.workspaceName,
      capturedAt,
      softwareFingerprints,
      activePackages: Object.freeze(options.activePackages ?? Object.keys(packages)),
      activeProfilesCount: options.activeProfilesCount ?? 1,
      activeRunsCount: options.activeRunsCount ?? 0,
      activeEvaluationsCount: options.activeEvaluationsCount ?? 0,
      snapshotSha256: snapshotDigest
    };

    return Object.freeze(snapshot);
  }
}
