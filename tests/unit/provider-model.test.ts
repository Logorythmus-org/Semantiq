import { describe, it, expect } from 'vitest';
import {
  ProviderModelAuditor,
  ProviderModelRegistry,
  type ProviderEcosystemDescriptor,
  type SandboxCapabilities
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Open and Commercial Provider Model', () => {
  const auditor = new ProviderModelAuditor();
  const registry = new ProviderModelRegistry();

  const standardCapabilities: SandboxCapabilities = {
    supportsSnapshots: true,
    supportsFilesystemDiff: true,
    supportsLiveStream: true,
    supportsMicroVM: true,
    supportsNetworkPolicy: true,
    supportsResourceHardening: true,
    maxExecutionTimeoutSeconds: 1800,
    supportedArchitectures: ['x86_64', 'aarch64']
  };

  const localDockerDescriptor: ProviderEcosystemDescriptor = {
    providerId: 'local-docker-oci',
    displayName: 'Local Docker Engine',
    version: '24.0.7',
    hostingCategory: 'LOCAL_OPEN_SOURCE',
    license: {
      spdxId: 'Apache-2.0',
      licenseName: 'Apache License 2.0',
      isOsiApproved: true,
      isCommercialUseAllowed: true,
      copyleftClause: false
    },
    costStructure: {
      billingModel: 'FREE_LOCAL',
      baseRatePerUnit: 0,
      currency: 'NONE',
      minBillingDurationSeconds: 0
    },
    privacyProfile: {
      zeroDataRetentionConfirmed: true,
      dataStorageRegion: 'local',
      telemetryPolicy: 'NO_TELEMETRY',
      retentionPolicy: 'EPHEMERAL_ZERO_RETENTION',
      ephemeralWipeVerified: true,
      complianceAttestations: ['LOCAL_HOST_ISOLATION']
    },
    trustTier: 'TCK_VERIFIED',
    securityGrade: 'B_ISOLATED_CONTAINER',
    capabilities: standardCapabilities,
    extensionMatrix: {
      supportsCustomTelemetry: false,
      supportsGpuAcceleration: true,
      supportsMemorySnapshots: false,
      supportsNetworkInterception: false,
      isolatedFromBenchmarkSemantics: true
    },
    registeredAt: '2026-08-15T12:00:00Z'
  };

  const commercialCloudDescriptor: ProviderEcosystemDescriptor = {
    providerId: 'cloud-e2b-sandbox',
    displayName: 'E2B Managed MicroVM Cloud',
    version: '1.2.0',
    hostingCategory: 'COMMERCIAL_MANAGED_CLOUD',
    license: {
      spdxId: 'Apache-2.0',
      licenseName: 'Apache License 2.0 (SDK) / Commercial Cloud',
      isOsiApproved: true,
      isCommercialUseAllowed: true,
      copyleftClause: false,
      termsUrl: 'https://e2b.dev/terms'
    },
    costStructure: {
      billingModel: 'PER_SECOND',
      baseRatePerUnit: 0.00015, // $0.00015 / sec ($0.54 / hr)
      currency: 'USD',
      minBillingDurationSeconds: 5,
      networkEgressRatePerGb: 0.05
    },
    privacyProfile: {
      zeroDataRetentionConfirmed: true,
      dataStorageRegion: 'us-east-1',
      telemetryPolicy: 'NO_TELEMETRY',
      retentionPolicy: 'EPHEMERAL_ZERO_RETENTION',
      ephemeralWipeVerified: true,
      complianceAttestations: ['SOC2_TYPE_II', 'ISO_27001']
    },
    trustTier: 'CRYPTOGRAPHICALLY_CERTIFIED',
    securityGrade: 'A_HARDENED_MICROVM',
    capabilities: standardCapabilities,
    extensionMatrix: {
      supportsCustomTelemetry: true,
      supportsGpuAcceleration: false,
      supportsMemorySnapshots: true,
      supportsNetworkInterception: true,
      vendorExtensionNamespace: 'e2b.custom',
      isolatedFromBenchmarkSemantics: true
    },
    registeredAt: '2026-08-15T12:00:00Z'
  };

  it('successfully audits and verifies a local open-source provider descriptor', () => {
    const report = auditor.auditProviderDescriptor(localDockerDescriptor);
    expect(report.isCompliant).toBe(true);
    expect(report.licenseCompatible).toBe(true);
    expect(report.extensionsIsolated).toBe(true);
    expect(report.privacyCompliant).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it('successfully audits and verifies a commercial managed cloud provider descriptor', () => {
    const report = auditor.auditProviderDescriptor(commercialCloudDescriptor);
    expect(report.isCompliant).toBe(true);
    expect(report.licenseCompatible).toBe(true);
    expect(report.extensionsIsolated).toBe(true);
    expect(report.privacyCompliant).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it('flags un-isolated extensions and missing license SPDX metadata', () => {
    const invalidDescriptor: ProviderEcosystemDescriptor = {
      ...localDockerDescriptor,
      providerId: 'invalid-provider',
      license: {
        ...localDockerDescriptor.license,
        spdxId: ''
      },
      extensionMatrix: {
        ...localDockerDescriptor.extensionMatrix,
        isolatedFromBenchmarkSemantics: false
      }
    };

    const report = auditor.auditProviderDescriptor(invalidDescriptor);
    expect(report.isCompliant).toBe(false);
    expect(report.licenseCompatible).toBe(false);
    expect(report.extensionsIsolated).toBe(false);
    expect(report.violations).toContain('License SPDX identifier is missing.');
    expect(report.violations).toContain('Provider extensions are not isolated from canonical benchmark semantics.');
  });

  it('flags commercial cloud providers that fail zero data retention confirmation', () => {
    const nonPrivateCloudDescriptor: ProviderEcosystemDescriptor = {
      ...commercialCloudDescriptor,
      providerId: 'leaky-cloud',
      privacyProfile: {
        ...commercialCloudDescriptor.privacyProfile,
        zeroDataRetentionConfirmed: false,
        ephemeralWipeVerified: false
      }
    };

    const report = auditor.auditProviderDescriptor(nonPrivateCloudDescriptor);
    expect(report.isCompliant).toBe(false);
    expect(report.privacyCompliant).toBe(false);
    expect(report.violations).toContain('Commercial cloud provider has not confirmed zero data retention policy.');
    expect(report.violations).toContain('Provider has not verified ephemeral volume wiping on teardown.');
  });

  it('calculates deterministic cost attribution for free local execution', () => {
    const costRecord = auditor.calculateCost(localDockerDescriptor, 'inst-001', 45000, 1024 * 1024);
    expect(costRecord.providerId).toBe('local-docker-oci');
    expect(costRecord.computeCost).toBe(0);
    expect(costRecord.egressCost).toBe(0);
    expect(costRecord.totalCost).toBe(0);
    expect(costRecord.billingModel).toBe('FREE_LOCAL');
  });

  it('calculates deterministic cost attribution for per-second commercial execution', () => {
    // 12.4 seconds -> rounded up to 13 seconds, rate = $0.00015/sec -> 13 * 0.00015 = $0.00195
    // 2 GB egress -> 2 * $0.05 = $0.10
    // Total = $0.10195
    const costRecord = auditor.calculateCost(commercialCloudDescriptor, 'inst-002', 12400, 2 * 1024 * 1024 * 1024);
    expect(costRecord.providerId).toBe('cloud-e2b-sandbox');
    expect(costRecord.executionDurationMs).toBe(12400);
    expect(costRecord.billedDurationMs).toBe(13000);
    expect(costRecord.computeCost).toBe(0.00195);
    expect(costRecord.egressCost).toBe(0.1);
    expect(costRecord.totalCost).toBe(0.10195);
    expect(costRecord.currency).toBe('USD');
  });

  it('manages provider registration and classification in ProviderModelRegistry', () => {
    registry.registerProviderDescriptor(localDockerDescriptor);
    registry.registerProviderDescriptor(commercialCloudDescriptor);

    expect(registry.getDescriptor('local-docker-oci')?.displayName).toBe('Local Docker Engine');
    expect(registry.getDescriptor('cloud-e2b-sandbox')?.displayName).toBe('E2B Managed MicroVM Cloud');

    const openSourceList = registry.listByHostingCategory('LOCAL_OPEN_SOURCE');
    expect(openSourceList.length).toBe(1);
    expect(openSourceList[0]?.providerId).toBe('local-docker-oci');

    const cloudList = registry.listByHostingCategory('COMMERCIAL_MANAGED_CLOUD');
    expect(cloudList.length).toBe(1);
    expect(cloudList[0]?.providerId).toBe('cloud-e2b-sandbox');

    expect(registry.listDescriptors().length).toBe(2);
    expect(registry.removeDescriptor('local-docker-oci')).toBe(true);
    expect(registry.listDescriptors().length).toBe(1);
  });
});
