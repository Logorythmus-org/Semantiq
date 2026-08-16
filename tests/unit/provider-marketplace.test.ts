import { describe, it, expect } from 'vitest';
import {
  ProviderMarketplaceEngine,
  type ProviderMarketplaceListing,
  type SandboxCapabilities
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Provider Marketplace Architecture', () => {
  const engine = new ProviderMarketplaceEngine();

  const standardCaps: SandboxCapabilities = {
    supportsSnapshots: true,
    supportsFilesystemDiff: true,
    supportsLiveStream: true,
    supportsMicroVM: true,
    supportsNetworkPolicy: true,
    supportsResourceHardening: true,
    maxExecutionTimeoutSeconds: 1800,
    supportedArchitectures: ['x86_64', 'aarch64']
  };

  const samplePublisher = {
    providerId: 'pub-01',
    organization: 'SemantIQ Foundation',
    publicKeyHex: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    registeredAt: '2026-08-15T12:00:00Z'
  };

  const localDockerListing: ProviderMarketplaceListing = {
    listingId: 'listing-local-docker',
    providerId: 'local-docker-oci',
    displayName: 'Local Docker Daemon',
    description: 'High-speed local OCI container execution with zero network dependency.',
    version: '24.0.7',
    publisher: samplePublisher,
    hostingCategory: 'LOCAL_OPEN_SOURCE',
    deploymentMode: 'LOCAL_DAEMON',
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
    capabilities: {
      ...standardCaps,
      supportsMicroVM: false
    },
    extensionMatrix: {
      supportsCustomTelemetry: false,
      supportsGpuAcceleration: true,
      supportsMemorySnapshots: false,
      supportsNetworkInterception: false,
      isolatedFromBenchmarkSemantics: true
    },
    slaMetrics: {
      uptimePercentage: 100.0,
      p50ColdBootLatencyMs: 1200,
      p95ColdBootLatencyMs: 2500,
      maxConcurrentSandboxes: 8
    },
    tags: ['local', 'open-source', 'docker', 'offline-capable'],
    publishedAt: '2026-08-15T12:00:00Z',
    signatureHex: '3045022100e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85502202b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  };

  const cloudMicroVmListing: ProviderMarketplaceListing = {
    listingId: 'listing-e2b-cloud',
    providerId: 'cloud-e2b-microvm',
    displayName: 'E2B Managed MicroVM Cloud',
    description: 'Hardware-level microVM isolation with 200ms cold boots and parallel scaling.',
    version: '1.2.0',
    publisher: {
      ...samplePublisher,
      providerId: 'pub-e2b',
      organization: 'E2B Inc'
    },
    hostingCategory: 'COMMERCIAL_MANAGED_CLOUD',
    deploymentMode: 'MANAGED_MULTI_TENANT',
    license: {
      spdxId: 'Apache-2.0',
      licenseName: 'Apache License 2.0 (SDK)',
      isOsiApproved: true,
      isCommercialUseAllowed: true,
      copyleftClause: false,
      termsUrl: 'https://e2b.dev/terms'
    },
    costStructure: {
      billingModel: 'PER_SECOND',
      baseRatePerUnit: 0.00015,
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
    capabilities: standardCaps,
    extensionMatrix: {
      supportsCustomTelemetry: true,
      supportsGpuAcceleration: false,
      supportsMemorySnapshots: true,
      supportsNetworkInterception: true,
      vendorExtensionNamespace: 'e2b.v1',
      isolatedFromBenchmarkSemantics: true
    },
    slaMetrics: {
      uptimePercentage: 99.99,
      p50ColdBootLatencyMs: 250,
      p95ColdBootLatencyMs: 600,
      maxConcurrentSandboxes: 128
    },
    tags: ['cloud', 'microvm', 'firecracker', 'high-concurrency'],
    publishedAt: '2026-08-15T12:00:00Z',
    signatureHex: '3045022100aabbccddeeff00112233445566778899aabbccddeeff001122334455667788990220aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'
  };

  const enterpriseAirgapListing: ProviderMarketplaceListing = {
    listingId: 'listing-onprem-airgap',
    providerId: 'airgap-kata-cluster',
    displayName: 'On-Premise Kata MicroVM Cluster',
    description: 'Zero egress air-gapped hardware microVMs for classified evaluations.',
    version: '3.0.1',
    publisher: samplePublisher,
    hostingCategory: 'ENTERPRISE_PRIVATE_AIRGAPPED',
    deploymentMode: 'AIRGAPPED_ON_PREM',
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
      dataStorageRegion: 'airgapped',
      telemetryPolicy: 'NO_TELEMETRY',
      retentionPolicy: 'EPHEMERAL_ZERO_RETENTION',
      ephemeralWipeVerified: true,
      complianceAttestations: ['SOC2_TYPE_II', 'HIPAA_BAA']
    },
    trustTier: 'CRYPTOGRAPHICALLY_CERTIFIED',
    securityGrade: 'A_HARDENED_MICROVM',
    capabilities: standardCaps,
    extensionMatrix: {
      supportsCustomTelemetry: false,
      supportsGpuAcceleration: true,
      supportsMemorySnapshots: true,
      supportsNetworkInterception: false,
      isolatedFromBenchmarkSemantics: true
    },
    slaMetrics: {
      uptimePercentage: 99.999,
      p50ColdBootLatencyMs: 350,
      p95ColdBootLatencyMs: 800,
      maxConcurrentSandboxes: 32
    },
    tags: ['airgapped', 'on-prem', 'kata', 'enterprise'],
    publishedAt: '2026-08-15T12:00:00Z',
    signatureHex: '3045022100112233445566778899aabbccddeeff00112233445566778899aabbccddeeff0220112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'
  };

  it('publishes and audits valid provider marketplace listings', () => {
    const report1 = engine.publishListing(localDockerListing);
    const report2 = engine.publishListing(cloudMicroVmListing);
    const report3 = engine.publishListing(enterpriseAirgapListing);

    expect(report1.isValid).toBe(true);
    expect(report2.isValid).toBe(true);
    expect(report3.isValid).toBe(true);
    expect(engine.listAll().length).toBe(3);
  });

  it('rejects listings with invalid signatures or non-isolated extensions', () => {
    const malformedListing: ProviderMarketplaceListing = {
      ...localDockerListing,
      listingId: 'malformed-01',
      signatureHex: 'short',
      extensionMatrix: {
        ...localDockerListing.extensionMatrix,
        isolatedFromBenchmarkSemantics: false
      }
    };

    const audit = engine.publishListing(malformedListing);
    expect(audit.isValid).toBe(false);
    expect(audit.violations).toContain('Marketplace listing cryptographic signature is missing or malformed.');
    expect(audit.violations).toContain('Extensions must be isolated from canonical benchmark semantics.');
  });

  it('filters listings by deployment mode and offline requirement', () => {
    const offlineResult = engine.discover({ offlineOnly: true });
    expect(offlineResult.totalMatchingListings).toBe(2);
    expect(offlineResult.rankedCandidates.some(c => c.listing.listingId === 'listing-e2b-cloud')).toBe(false);

    const daemonOnly = engine.discover({ requiredDeploymentModes: ['LOCAL_DAEMON'] });
    expect(daemonOnly.totalMatchingListings).toBe(1);
    expect(daemonOnly.selectedPrimaryListing?.listingId).toBe('listing-local-docker');
  });

  it('filters listings by security grade and hardware microVM capability', () => {
    const microVmResult = engine.discover({
      minSecurityGrade: 'A_HARDENED_MICROVM',
      requiredCapabilities: { microVM: true }
    });

    expect(microVmResult.totalMatchingListings).toBe(2);
    expect(microVmResult.rankedCandidates.some(c => c.listing.listingId === 'listing-local-docker')).toBe(false);
  });

  it('ranks matched listings using multi-criteria scoring with failover chains', () => {
    const allMatches = engine.discover({});
    expect(allMatches.totalMatchingListings).toBe(3);
    expect(allMatches.selectedPrimaryListing).toBeDefined();
    expect(allMatches.failoverListings.length).toBe(2);

    const topCandidate = allMatches.rankedCandidates[0]!;
    expect(topCandidate.score.totalScore).toBeGreaterThan(0.7);
    expect(topCandidate.score.hardConstraintsPassed).toBe(true);
    expect(topCandidate.rationale).toContain('Matched');
  });

  it('manages listing withdrawal correctly', () => {
    expect(engine.getListing('listing-local-docker')).toBeDefined();
    expect(engine.withdrawListing('listing-local-docker')).toBe(true);
    expect(engine.getListing('listing-local-docker')).toBeUndefined();
    expect(engine.listAll().length).toBe(2);
  });
});
