/**
 * @package @semantiq/evidence
 * Dataset Source, Dataset Snapshot, and Case Study Registry
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import { SchemaFingerprint } from "../schema-fingerprint.js";
import type {
  CaseStudy,
  DatasetSnapshot,
  DatasetSource,
  DatasetSourceType
} from "./types.js";

export interface CreateSnapshotOptions {
  readonly datasetSourceId: string;
  readonly versionTag: string;
  readonly records: readonly Record<string, unknown>[];
}

export class DatasetCaseRegistry {
  private readonly sources = new Map<string, DatasetSource>();
  private readonly snapshots = new Map<string, DatasetSnapshot>();
  private readonly caseStudies = new Map<string, CaseStudy>();

  constructor() {
    this.seedCanonicalSources();
  }

  public registerSource(source: Omit<DatasetSource, "createdAt">): DatasetSource {
    const fullSource: DatasetSource = {
      ...source,
      createdAt: new Date().toISOString()
    };
    this.sources.set(fullSource.id, Object.freeze(fullSource));
    return fullSource;
  }

  public getSource(sourceId: string): DatasetSource | undefined {
    return this.sources.get(sourceId);
  }

  public listSources(): readonly DatasetSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Creates an immutable DatasetSnapshot with cryptographic content and schema fingerprints.
   */
  public createSnapshot(options: CreateSnapshotOptions): DatasetSnapshot {
    const source = this.sources.get(options.datasetSourceId);
    if (!source) {
      throw new Error(`Dataset source not found: ${options.datasetSourceId}`);
    }

    const snapshotId = `dss_${options.datasetSourceId}_${options.versionTag.replace(/[^a-zA-Z0-9]/g, "_")}`;
    if (this.snapshots.has(snapshotId)) {
      throw new Error(`Snapshot already exists and is immutable: ${snapshotId}`);
    }

    const contentString = JSON.stringify(options.records);
    const contentFingerprint = computeSha256(contentString);
    const schemaFingerprint = SchemaFingerprint.computeFromEventStream(options.records);
    const byteSize = Buffer.byteLength(contentString, "utf8");

    // Partition digests (e.g. per record or per chunk)
    const partitionDigests = options.records.map((r, i) =>
      computeSha256(`${i}:${JSON.stringify(r)}`)
    );

    const snapshot: DatasetSnapshot = {
      id: snapshotId,
      datasetSourceId: options.datasetSourceId,
      versionTag: options.versionTag,
      contentFingerprint,
      schemaFingerprint,
      recordCount: options.records.length,
      byteSize,
      partitionDigests: Object.freeze(partitionDigests),
      snapshotTimestamp: new Date().toISOString(),
      isImmutable: true
    };

    const frozenSnapshot = Object.freeze(snapshot);
    this.snapshots.set(snapshotId, frozenSnapshot);
    return frozenSnapshot;
  }

  public getSnapshot(snapshotId: string): DatasetSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  public listSnapshots(datasetSourceId?: string): readonly DatasetSnapshot[] {
    const all = Array.from(this.snapshots.values());
    if (datasetSourceId) {
      return all.filter((s) => s.datasetSourceId === datasetSourceId);
    }
    return all;
  }

  /**
   * Registers a CaseStudy linking a Benchmark, Dataset Snapshot, and evaluation cases.
   */
  public registerCaseStudy(study: Omit<CaseStudy, "createdAt">): CaseStudy {
    const snapshot = this.snapshots.get(study.datasetSnapshotId);
    if (!snapshot) {
      throw new Error(`Cannot register CaseStudy with unknown DatasetSnapshot: ${study.datasetSnapshotId}`);
    }

    const caseStudy: CaseStudy = {
      ...study,
      createdAt: new Date().toISOString()
    };

    const frozenStudy = Object.freeze(caseStudy);
    this.caseStudies.set(caseStudy.id, frozenStudy);
    return frozenStudy;
  }

  public getCaseStudy(caseStudyId: string): CaseStudy | undefined {
    return this.caseStudies.get(caseStudyId);
  }

  public listCaseStudies(benchmarkId?: string): readonly CaseStudy[] {
    const all = Array.from(this.caseStudies.values());
    if (benchmarkId) {
      return all.filter((c) => c.benchmarkId === benchmarkId);
    }
    return all;
  }

  private seedCanonicalSources(): void {
    const hacsSource: DatasetSource = {
      id: "ds_hacs_core_scenarios",
      name: "HACS Core Multi-Step Agent Resilience Dataset",
      sourceType: "git" as DatasetSourceType,
      uri: "https://github.com/semantiq/hacs-scenarios.git",
      license: "Apache-2.0",
      defaultBranchOrTag: "v1.2.0",
      description: "Canonical benchmark scenarios for tool injection, context drift, and memory partitioning",
      createdAt: "2026-08-18T12:00:00.000Z"
    };

    const smfSource: DatasetSource = {
      id: "ds_smf_semantic_evaluation",
      name: "SMF Semantic Concept & Reasoning Dataset",
      sourceType: "huggingface" as DatasetSourceType,
      uri: "hf://datasets/semantiq/smf-reasoning-v1",
      license: "MIT",
      description: "Semantic evaluation fixtures for multi-perspective claims and epistemic classification",
      createdAt: "2026-08-18T12:00:00.000Z"
    };

    this.sources.set(hacsSource.id, Object.freeze(hacsSource));
    this.sources.set(smfSource.id, Object.freeze(smfSource));
  }
}
