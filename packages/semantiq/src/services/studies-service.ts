/**
 * @package @tech-club/semantiq
 * Authoritative Studies & Datasets Application Service
 */

import {
  DatasetCaseRegistry,
  type CaseStudy,
  type CreateSnapshotOptions,
  type DatasetSnapshot,
  type DatasetSource
} from "../../../evidence/src/index.js";

export class StudiesService {
  private readonly registry = new DatasetCaseRegistry();

  public async registerDatasetSource(source: Omit<DatasetSource, "createdAt">): Promise<DatasetSource> {
    return this.registry.registerSource(source);
  }

  public async createDatasetSnapshot(options: CreateSnapshotOptions): Promise<DatasetSnapshot> {
    return this.registry.createSnapshot(options);
  }

  public async registerCaseStudy(study: CaseStudy): Promise<void> {
    this.registry.registerCaseStudy(study);
  }

  public async getDatasetSource(sourceId: string): Promise<DatasetSource | undefined> {
    return this.registry.getSource(sourceId);
  }

  public async getDatasetSnapshot(snapshotId: string): Promise<DatasetSnapshot | undefined> {
    return this.registry.getSnapshot(snapshotId);
  }

  public async getCaseStudy(caseStudyId: string): Promise<CaseStudy | undefined> {
    return this.registry.getCaseStudy(caseStudyId);
  }

  public async listCaseStudies(): Promise<readonly CaseStudy[]> {
    return this.registry.listCaseStudies();
  }

  public async listDatasetSnapshots(datasetId?: string): Promise<readonly DatasetSnapshot[]> {
    return this.registry.listSnapshots(datasetId);
  }
}
