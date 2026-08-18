/**
 * @package @tech-club/semantiq
 * Authoritative Studies, Partner Replication, and Exchange Application Service
 * 
 * Invariants:
 * 1. Counterevidence remains visible in aggregation.
 * 2. E4 requires genuine context diversity and remains non-causal.
 * 3. Replication demonstrates empirical consistency across contexts, not causal proof or universal truth.
 */

import {
  DatasetCaseRegistry,
  ExchangeRedactionEngine,
  PartnerOrganizationRegistry,
  ReplicationRegistryEngine,
  type CaseStudy,
  type CreateSnapshotOptions,
  type CrossOrgReplicationAggregation,
  type DatasetSnapshot,
  type DatasetSource,
  type PartnerOrganization,
  type PartnerStudy,
  type RedactedPackageResult,
  type RedactPackageOptions,
  type RegisterPartnerOptions,
  type ReplicationRecord
} from "../../../evidence/src/index.js";
import type { PartnerRole } from "../../../sandbox-contracts/src/index.js";

export class StudiesService {
  private readonly caseRegistry = new DatasetCaseRegistry();
  public readonly partnerRegistry = new PartnerOrganizationRegistry();
  public readonly replicationRegistry = new ReplicationRegistryEngine();
  public readonly redactionEngine = new ExchangeRedactionEngine();

  // -------------------------------------------------------------
  // Dataset and Case Registry
  // -------------------------------------------------------------
  public async registerDatasetSource(source: Omit<DatasetSource, "createdAt">): Promise<DatasetSource> {
    return this.caseRegistry.registerSource(source);
  }

  public async createDatasetSnapshot(options: CreateSnapshotOptions): Promise<DatasetSnapshot> {
    return this.caseRegistry.createSnapshot(options);
  }

  public async registerCaseStudy(study: CaseStudy): Promise<void> {
    this.caseRegistry.registerCaseStudy(study);
  }

  public async getDatasetSource(sourceId: string): Promise<DatasetSource | undefined> {
    return this.caseRegistry.getSource(sourceId);
  }

  public async getDatasetSnapshot(snapshotId: string): Promise<DatasetSnapshot | undefined> {
    return this.caseRegistry.getSnapshot(snapshotId);
  }

  public async getCaseStudy(caseStudyId: string): Promise<CaseStudy | undefined> {
    return this.caseRegistry.getCaseStudy(caseStudyId);
  }

  public async listCaseStudies(): Promise<readonly CaseStudy[]> {
    return this.caseRegistry.listCaseStudies();
  }

  public async listDatasetSnapshots(datasetId?: string): Promise<readonly DatasetSnapshot[]> {
    return this.caseRegistry.listSnapshots(datasetId);
  }

  // -------------------------------------------------------------
  // Partner Organizations
  // -------------------------------------------------------------
  public async registerPartner(options: RegisterPartnerOptions): Promise<PartnerOrganization> {
    return this.partnerRegistry.registerOrganization(options);
  }

  public async getPartner(id: string): Promise<PartnerOrganization | undefined> {
    return this.partnerRegistry.getOrganization(id);
  }

  public async listPartners(filter?: {
    role?: PartnerRole | undefined;
  }): Promise<readonly PartnerOrganization[]> {
    return this.partnerRegistry.listOrganizations(filter);
  }

  // -------------------------------------------------------------
  // Partner Studies & Exchange
  // -------------------------------------------------------------
  public async registerPartnerStudy(study: PartnerStudy): Promise<PartnerStudy> {
    return this.replicationRegistry.registerStudy(study);
  }

  public async getPartnerStudy(id: string): Promise<PartnerStudy | undefined> {
    return this.replicationRegistry.getStudy(id);
  }

  public async listPartnerStudies(filter?: {
    organizationId?: string | undefined;
  }): Promise<readonly PartnerStudy[]> {
    return this.replicationRegistry.listStudies(filter);
  }

  public async createRedactedExchangePackage(
    options: RedactPackageOptions
  ): Promise<RedactedPackageResult> {
    return this.redactionEngine.redactBundleForExchange(options);
  }

  // -------------------------------------------------------------
  // Replication Records & Cross-Organization Aggregation
  // -------------------------------------------------------------
  public async registerReplication(record: ReplicationRecord): Promise<ReplicationRecord> {
    return this.replicationRegistry.registerReplication(record);
  }

  public async getReplication(replicationId: string): Promise<ReplicationRecord | undefined> {
    return this.replicationRegistry.getReplication(replicationId);
  }

  public async listReplicationsForClaim(claimId: string): Promise<readonly ReplicationRecord[]> {
    return this.replicationRegistry.listReplicationsForClaim(claimId);
  }

  public async aggregateReplicationsForClaim(
    claimId: string
  ): Promise<CrossOrgReplicationAggregation> {
    return this.replicationRegistry.aggregateReplications(claimId);
  }
}
