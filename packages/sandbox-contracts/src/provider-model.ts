/**
 * @package @tech-club/sandbox-contracts
 * Open & Commercial Provider Ecosystem Model
 */

import type { SandboxCapabilities } from './types.js';
import type { ProviderTrustTier, SecurityPostureGrade } from './trust-verification.js';

export type ProviderHostingCategory =
  | 'LOCAL_OPEN_SOURCE'
  | 'SELF_HOSTED_DEDICATED'
  | 'COMMERCIAL_MANAGED_CLOUD'
  | 'ENTERPRISE_PRIVATE_AIRGAPPED'
  | 'DETERMINISTIC_REPLAY';

export type ProviderBillingModel =
  | 'FREE_LOCAL'
  | 'PER_SECOND'
  | 'PER_MINUTE'
  | 'PER_INSTANCE_HOUR'
  | 'SUBSCRIPTION_TIER'
  | 'FIXED_PER_RUN';

export type ProviderDataRetentionPolicy =
  | 'EPHEMERAL_ZERO_RETENTION'
  | 'VOLATILE_UNTIL_TERMINATION'
  | 'HOST_LOGS_RETAINED_30_DAYS'
  | 'PERSISTENT_STORAGE';

export type ProviderTelemetryPolicy =
  | 'NO_TELEMETRY'
  | 'ANONYMIZED_METRICS'
  | 'FULL_TELEMETRY';

export interface ProviderLicenseInfo {
  readonly spdxId: string; // e.g. "Apache-2.0", "MIT", "BSD-3-Clause", "Proprietary", "AGPL-3.0-only"
  readonly licenseName: string;
  readonly isOsiApproved: boolean;
  readonly isCommercialUseAllowed: boolean;
  readonly copyleftClause: boolean;
  readonly termsUrl?: string | undefined;
}

export interface ProviderCostStructure {
  readonly billingModel: ProviderBillingModel;
  readonly baseRatePerUnit: number;
  readonly currency: 'USD' | 'EUR' | 'GBP' | 'NONE';
  readonly minBillingDurationSeconds: number;
  readonly networkEgressRatePerGb?: number | undefined;
  readonly idleTimeoutSeconds?: number | undefined;
}

export interface ProviderDataPrivacyProfile {
  readonly zeroDataRetentionConfirmed: boolean;
  readonly dataStorageRegion: string; // e.g. "local", "us-east-1", "eu-central-1", "airgapped"
  readonly telemetryPolicy: ProviderTelemetryPolicy;
  readonly retentionPolicy: ProviderDataRetentionPolicy;
  readonly ephemeralWipeVerified: boolean;
  readonly complianceAttestations: readonly string[]; // e.g. ["SOC2_TYPE_II", "ISO_27001", "HIPAA_BAA"]
}

export interface ProviderExtensionMatrix {
  readonly supportsCustomTelemetry: boolean;
  readonly supportsGpuAcceleration: boolean;
  readonly supportsMemorySnapshots: boolean;
  readonly supportsNetworkInterception: boolean;
  readonly vendorExtensionNamespace?: string | undefined;
  readonly isolatedFromBenchmarkSemantics: boolean;
}

export interface ProviderEcosystemDescriptor {
  readonly providerId: string;
  readonly displayName: string;
  readonly version: string;
  readonly hostingCategory: ProviderHostingCategory;
  readonly license: ProviderLicenseInfo;
  readonly costStructure: ProviderCostStructure;
  readonly privacyProfile: ProviderDataPrivacyProfile;
  readonly trustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly capabilities: SandboxCapabilities;
  readonly extensionMatrix: ProviderExtensionMatrix;
  readonly registeredAt: string;
}

export interface CostAttributionRecord {
  readonly attributionId: string;
  readonly providerId: string;
  readonly instanceId: string;
  readonly executionDurationMs: number;
  readonly billedDurationMs: number;
  readonly computeCost: number;
  readonly egressCost: number;
  readonly totalCost: number;
  readonly currency: string;
  readonly billingModel: ProviderBillingModel;
  readonly timestamp: string;
}

export interface ProviderModelAuditReport {
  readonly providerId: string;
  readonly isCompliant: boolean;
  readonly licenseCompatible: boolean;
  readonly extensionsIsolated: boolean;
  readonly privacyCompliant: boolean;
  readonly violations: readonly string[];
  readonly auditedAt: string;
}

/**
 * Provider Model Auditor.
 * Audits provider descriptors for license compatibility, privacy policies,
 * extension isolation, and calculates deterministic cost attribution.
 */
export class ProviderModelAuditor {
  auditProviderDescriptor(descriptor: ProviderEcosystemDescriptor): ProviderModelAuditReport {
    const violations: string[] = [];

    // 1. License Check
    let licenseCompatible = true;
    if (!descriptor.license.spdxId || descriptor.license.spdxId.trim().length === 0) {
      violations.push('License SPDX identifier is missing.');
      licenseCompatible = false;
    }
    if (descriptor.license.copyleftClause && descriptor.hostingCategory === 'LOCAL_OPEN_SOURCE' && descriptor.license.spdxId.startsWith('AGPL')) {
      violations.push('AGPL license detected; runtime must operate strictly across network/CLI process boundary.');
    }

    // 2. Extension Isolation Check
    let extensionsIsolated = true;
    if (!descriptor.extensionMatrix.isolatedFromBenchmarkSemantics) {
      violations.push('Provider extensions are not isolated from canonical benchmark semantics.');
      extensionsIsolated = false;
    }

    // 3. Privacy & Zero-Retention Check
    let privacyCompliant = true;
    if (descriptor.hostingCategory === 'COMMERCIAL_MANAGED_CLOUD' && !descriptor.privacyProfile.zeroDataRetentionConfirmed) {
      violations.push('Commercial cloud provider has not confirmed zero data retention policy.');
      privacyCompliant = false;
    }
    if (!descriptor.privacyProfile.ephemeralWipeVerified) {
      violations.push('Provider has not verified ephemeral volume wiping on teardown.');
      privacyCompliant = false;
    }

    // 4. Cost Structure Validity Check
    if (descriptor.costStructure.billingModel !== 'FREE_LOCAL' && descriptor.costStructure.baseRatePerUnit < 0) {
      violations.push('Negative billing rates are invalid.');
    }

    const isCompliant = violations.length === 0;

    return {
      providerId: descriptor.providerId,
      isCompliant,
      licenseCompatible,
      extensionsIsolated,
      privacyCompliant,
      violations,
      auditedAt: new Date().toISOString()
    };
  }

  calculateCost(
    descriptor: ProviderEcosystemDescriptor,
    instanceId: string,
    executionDurationMs: number,
    networkEgressBytes = 0
  ): CostAttributionRecord {
    const cost = descriptor.costStructure;
    let billedDurationMs = executionDurationMs;
    let computeCost = 0;

    if (cost.billingModel === 'FREE_LOCAL') {
      computeCost = 0;
    } else if (cost.billingModel === 'PER_SECOND') {
      const durationSec = Math.max(cost.minBillingDurationSeconds, Math.ceil(executionDurationMs / 1000));
      billedDurationMs = durationSec * 1000;
      computeCost = durationSec * cost.baseRatePerUnit;
    } else if (cost.billingModel === 'PER_MINUTE') {
      const durationMin = Math.max(Math.ceil(cost.minBillingDurationSeconds / 60), Math.ceil(executionDurationMs / 60000));
      billedDurationMs = durationMin * 60000;
      computeCost = durationMin * cost.baseRatePerUnit;
    } else if (cost.billingModel === 'PER_INSTANCE_HOUR') {
      const durationHours = Math.max(cost.minBillingDurationSeconds / 3600, executionDurationMs / 3600000);
      billedDurationMs = Math.ceil(durationHours * 3600) * 1000;
      computeCost = durationHours * cost.baseRatePerUnit;
    } else if (cost.billingModel === 'FIXED_PER_RUN') {
      computeCost = cost.baseRatePerUnit;
    }

    const egressGb = networkEgressBytes / (1024 * 1024 * 1024);
    const egressCost = (cost.networkEgressRatePerGb ?? 0) * egressGb;
    const totalCost = Number((computeCost + egressCost).toFixed(6));

    return {
      attributionId: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      providerId: descriptor.providerId,
      instanceId,
      executionDurationMs,
      billedDurationMs,
      computeCost: Number(computeCost.toFixed(6)),
      egressCost: Number(egressCost.toFixed(6)),
      totalCost,
      currency: cost.currency,
      billingModel: cost.billingModel,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Provider Model Registry.
 * Holds descriptors for all available execution providers in the ecosystem.
 */
export class ProviderModelRegistry {
  private readonly descriptors: Map<string, ProviderEcosystemDescriptor> = new Map();
  private readonly auditor = new ProviderModelAuditor();

  registerProviderDescriptor(descriptor: ProviderEcosystemDescriptor): ProviderModelAuditReport {
    const auditReport = this.auditor.auditProviderDescriptor(descriptor);
    if (auditReport.isCompliant) {
      this.descriptors.set(descriptor.providerId, descriptor);
    }
    return auditReport;
  }

  getDescriptor(providerId: string): ProviderEcosystemDescriptor | undefined {
    return this.descriptors.get(providerId);
  }

  listDescriptors(): readonly ProviderEcosystemDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  listByHostingCategory(category: ProviderHostingCategory): readonly ProviderEcosystemDescriptor[] {
    return Array.from(this.descriptors.values()).filter(d => d.hostingCategory === category);
  }

  removeDescriptor(providerId: string): boolean {
    return this.descriptors.delete(providerId);
  }
}
