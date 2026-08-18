/**
 * @package @semantiq/evidence
 * Study Execution Manifest Registry
 */

import { StudyExecutionManifestValidator } from "./manifest-validator.js";
import type {
  ManifestExecutionStatus,
  ManifestIngestionResult,
  StudyExecutionManifest
} from "./types.js";
import type { StudyProtocol } from "../study-protocols/types.js";

export class StudyExecutionManifestRegistry {
  private readonly validator = new StudyExecutionManifestValidator();
  private readonly manifests = new Map<string, StudyExecutionManifest>();
  private readonly ingestionResults = new Map<string, ManifestIngestionResult>();

  public ingestManifest(
    manifest: StudyExecutionManifest,
    protocol: StudyProtocol
  ): ManifestIngestionResult {
    const result = this.validator.validateAndIngestManifest(manifest, protocol);
    this.manifests.set(manifest.manifestId, Object.freeze({ ...manifest }));
    this.ingestionResults.set(manifest.manifestId, result);
    return result;
  }

  public getManifest(manifestId: string): StudyExecutionManifest | undefined {
    return this.manifests.get(manifestId);
  }

  public getIngestionResult(manifestId: string): ManifestIngestionResult | undefined {
    return this.ingestionResults.get(manifestId);
  }

  public listManifests(filter?: {
    organizationId?: string | undefined;
    status?: ManifestExecutionStatus | undefined;
  }): readonly StudyExecutionManifest[] {
    let list = Array.from(this.manifests.values());
    if (filter?.organizationId) {
      list = list.filter((m) => m.organizationId === filter.organizationId);
    }
    if (filter?.status) {
      list = list.filter((m) => {
        const res = this.ingestionResults.get(m.manifestId);
        return res?.status === filter.status;
      });
    }
    return Object.freeze(list);
  }
}
