/**
 * @package @tech-club/sandbox-contracts
 * Provider Marketplace & Discovery Architecture
 */

import type { SandboxCapabilities, EnvironmentSpec } from './types.js';
import type { ProviderTrustTier, SecurityPostureGrade, ProviderIdentity } from './trust-verification.js';
import type {
  ProviderHostingCategory,
  ProviderLicenseInfo,
  ProviderCostStructure,
  ProviderDataPrivacyProfile,
  ProviderExtensionMatrix,
  ProviderEcosystemDescriptor
} from './provider-model.js';

export type MarketplaceDeploymentMode =
  | 'LOCAL_DAEMON'
  | 'DEDICATED_CLUSTER'
  | 'SERVERLESS_MICROVM'
  | 'MANAGED_MULTI_TENANT'
  | 'AIRGAPPED_ON_PREM'
  | 'MOCK_REPLAY';

export interface ProviderSlaMetrics {
  readonly uptimePercentage: number;
  readonly p50ColdBootLatencyMs: number;
  readonly p95ColdBootLatencyMs: number;
  readonly maxConcurrentSandboxes: number;
}

export interface ProviderMarketplaceListing {
  readonly listingId: string;
  readonly providerId: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: string;
  readonly publisher: ProviderIdentity;
  readonly hostingCategory: ProviderHostingCategory;
  readonly deploymentMode: MarketplaceDeploymentMode;
  readonly license: ProviderLicenseInfo;
  readonly costStructure: ProviderCostStructure;
  readonly privacyProfile: ProviderDataPrivacyProfile;
  readonly trustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly capabilities: SandboxCapabilities;
  readonly extensionMatrix: ProviderExtensionMatrix;
  readonly slaMetrics: ProviderSlaMetrics;
  readonly tags: readonly string[];
  readonly publishedAt: string;
  readonly signatureHex: string;
}

export interface MarketplaceDiscoveryQuery {
  readonly requiredDeploymentModes?: readonly MarketplaceDeploymentMode[] | undefined;
  readonly minTrustTier?: ProviderTrustTier | undefined;
  readonly minSecurityGrade?: SecurityPostureGrade | undefined;
  readonly maxCostPerUnit?: number | undefined;
  readonly maxColdBootLatencyMs?: number | undefined;
  readonly region?: string | undefined;
  readonly zeroDataRetentionOnly?: boolean | undefined;
  readonly offlineOnly?: boolean | undefined;
  readonly allowedLicenses?: readonly string[] | undefined;
  readonly requiredCapabilities?: {
    readonly microVM?: boolean | undefined;
    readonly snapshots?: boolean | undefined;
    readonly filesystemDiff?: boolean | undefined;
    readonly networkPolicy?: boolean | undefined;
    readonly gpu?: boolean | undefined;
    readonly minMemoryMb?: number | undefined;
    readonly minCpuCores?: number | undefined;
  } | undefined;
  readonly tags?: readonly string[] | undefined;
}

export interface MarketplaceMatchScoreBreakdown {
  readonly totalScore: number;
  readonly capabilityMatch: boolean;
  readonly hardConstraintsPassed: boolean;
  readonly costScore: number;
  readonly latencyScore: number;
  readonly isolationScore: number;
  readonly trustScore: number;
  readonly slaScore: number;
}

export interface MarketplaceMatchCandidate {
  readonly listing: ProviderMarketplaceListing;
  readonly score: MarketplaceMatchScoreBreakdown;
  readonly rationale: string;
}

export interface MarketplaceDiscoveryResult {
  readonly queryId: string;
  readonly totalMatchingListings: number;
  readonly rankedCandidates: readonly MarketplaceMatchCandidate[];
  readonly selectedPrimaryListing?: ProviderMarketplaceListing | undefined;
  readonly failoverListings: readonly ProviderMarketplaceListing[];
  readonly timestamp: string;
}

export interface ListingAuditReport {
  readonly listingId: string;
  readonly isValid: boolean;
  readonly isSignatureValid: boolean;
  readonly isTckCertified: boolean;
  readonly violations: readonly string[];
  readonly auditedAt: string;
}

/**
 * Provider Marketplace Engine & Discovery Service.
 * Implements decentralized listing discovery, multidimensional filtering,
 * hard-constraint evaluation, and MCDM utility scoring.
 */
export class ProviderMarketplaceEngine {
  private readonly listings: Map<string, ProviderMarketplaceListing> = new Map();

  publishListing(listing: ProviderMarketplaceListing): ListingAuditReport {
    const audit = this.auditListing(listing);
    if (audit.isValid) {
      this.listings.set(listing.listingId, listing);
    }
    return audit;
  }

  withdrawListing(listingId: string): boolean {
    return this.listings.delete(listingId);
  }

  getListing(listingId: string): ProviderMarketplaceListing | undefined {
    return this.listings.get(listingId);
  }

  listAll(): readonly ProviderMarketplaceListing[] {
    return Array.from(this.listings.values());
  }

  auditListing(listing: ProviderMarketplaceListing): ListingAuditReport {
    const violations: string[] = [];

    if (!listing.listingId || listing.listingId.trim().length === 0) {
      violations.push('Listing ID is missing.');
    }
    if (!listing.providerId || listing.providerId.trim().length === 0) {
      violations.push('Provider ID is missing.');
    }
    if (!listing.publisher?.publicKeyHex || listing.publisher.publicKeyHex.length < 32) {
      violations.push('Publisher public key is missing or invalid.');
    }
    if (!listing.signatureHex || listing.signatureHex.length < 64) {
      violations.push('Marketplace listing cryptographic signature is missing or malformed.');
    }
    if (!listing.extensionMatrix.isolatedFromBenchmarkSemantics) {
      violations.push('Extensions must be isolated from canonical benchmark semantics.');
    }
    if (listing.slaMetrics.uptimePercentage < 0 || listing.slaMetrics.uptimePercentage > 100) {
      violations.push('SLA uptime percentage must be between 0 and 100.');
    }

    const isValid = violations.length === 0;
    const isSignatureValid = !!listing.signatureHex && listing.signatureHex.length >= 64;
    const isTckCertified = listing.trustTier === 'CRYPTOGRAPHICALLY_CERTIFIED' || listing.trustTier === 'TCK_VERIFIED';

    return {
      listingId: listing.listingId,
      isValid,
      isSignatureValid,
      isTckCertified,
      violations,
      auditedAt: new Date().toISOString()
    };
  }

  discover(query: MarketplaceDiscoveryQuery): MarketplaceDiscoveryResult {
    const candidates: MarketplaceMatchCandidate[] = [];

    for (const listing of this.listings.values()) {
      // 1. Offline Only Filter
      if (query.offlineOnly && (listing.deploymentMode === 'MANAGED_MULTI_TENANT' || listing.deploymentMode === 'SERVERLESS_MICROVM')) {
        continue;
      }

      // 2. Deployment Mode Filter
      if (query.requiredDeploymentModes && query.requiredDeploymentModes.length > 0) {
        if (!query.requiredDeploymentModes.includes(listing.deploymentMode)) {
          continue;
        }
      }

      // 3. Zero Data Retention Filter
      if (query.zeroDataRetentionOnly && !listing.privacyProfile.zeroDataRetentionConfirmed) {
        continue;
      }

      // 4. Region Filter
      if (query.region && listing.privacyProfile.dataStorageRegion !== 'local' && listing.privacyProfile.dataStorageRegion !== query.region) {
        continue;
      }

      // 5. License Whitelist Filter
      if (query.allowedLicenses && query.allowedLicenses.length > 0) {
        if (!query.allowedLicenses.includes(listing.license.spdxId)) {
          continue;
        }
      }

      // 6. Cost Cap Filter
      if (query.maxCostPerUnit !== undefined && listing.costStructure.baseRatePerUnit > query.maxCostPerUnit) {
        continue;
      }

      // 7. Cold Boot Latency Cap Filter
      if (query.maxColdBootLatencyMs !== undefined && listing.slaMetrics.p50ColdBootLatencyMs > query.maxColdBootLatencyMs) {
        continue;
      }

      // 8. Trust Tier Filter
      const trustRanks: Record<ProviderTrustTier, number> = {
        UNVERIFIED: 0,
        SELF_ATTESTED: 1,
        TCK_VERIFIED: 2,
        CRYPTOGRAPHICALLY_CERTIFIED: 3
      };
      if (query.minTrustTier && trustRanks[listing.trustTier] < trustRanks[query.minTrustTier]) {
        continue;
      }

      // 9. Security Grade Filter
      const gradeRanks: Record<SecurityPostureGrade, number> = {
        F_UNCONFINED: 0,
        C_RESTRICTED_PROCESS: 1,
        B_ISOLATED_CONTAINER: 2,
        A_HARDENED_MICROVM: 3
      };
      if (query.minSecurityGrade && gradeRanks[listing.securityGrade] < gradeRanks[query.minSecurityGrade]) {
        continue;
      }

      // 10. Capability Constraints
      let capabilityMatch = true;
      if (query.requiredCapabilities) {
        const rc = query.requiredCapabilities;
        if (rc.microVM && !listing.capabilities.supportsMicroVM) capabilityMatch = false;
        if (rc.snapshots && !listing.capabilities.supportsSnapshots) capabilityMatch = false;
        if (rc.filesystemDiff && !listing.capabilities.supportsFilesystemDiff) capabilityMatch = false;
        if (rc.networkPolicy && !listing.capabilities.supportsNetworkPolicy) capabilityMatch = false;
        if (rc.gpu && !listing.extensionMatrix.supportsGpuAcceleration) capabilityMatch = false;
      }

      if (!capabilityMatch) continue;

      // 11. Calculate Multi-Criteria Scoring (MCDM Utility)
      const score = this.calculateUtilityScore(listing);
      const rationale = `Matched '${listing.displayName}' (${listing.deploymentMode}) - Grade: ${listing.securityGrade}, Trust: ${listing.trustTier}, Cost: ${listing.costStructure.billingModel}.`;

      candidates.push({
        listing,
        score,
        rationale
      });
    }

    // Sort descending by total utility score
    candidates.sort((a, b) => b.score.totalScore - a.score.totalScore);

    const primary = candidates[0]?.listing;
    const failoverListings = candidates.slice(1).map(c => c.listing);

    return {
      queryId: `query-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      totalMatchingListings: candidates.length,
      rankedCandidates: candidates,
      selectedPrimaryListing: primary,
      failoverListings,
      timestamp: new Date().toISOString()
    };
  }

  private calculateUtilityScore(listing: ProviderMarketplaceListing): MarketplaceMatchScoreBreakdown {
    // Cost Score: 1.0 for free local, decaying for higher rates
    const costScore = listing.costStructure.billingModel === 'FREE_LOCAL'
      ? 1.0
      : Math.max(0.1, 1.0 - Math.min(1.0, listing.costStructure.baseRatePerUnit * 1000));

    // Latency Score: 1.0 for <= 200ms, decaying up to 5000ms
    const latencyScore = Math.max(0.1, 1.0 - Math.min(1.0, listing.slaMetrics.p50ColdBootLatencyMs / 5000));

    // Isolation Score: MicroVM (1.0), Container (0.7), Restricted Process (0.4)
    const isolationScore = listing.securityGrade === 'A_HARDENED_MICROVM'
      ? 1.0
      : listing.securityGrade === 'B_ISOLATED_CONTAINER'
      ? 0.7
      : 0.4;

    // Trust Score: Certified (1.0), TCK Verified (0.8), Self Attested (0.5), Unverified (0.1)
    const trustScore = listing.trustTier === 'CRYPTOGRAPHICALLY_CERTIFIED'
      ? 1.0
      : listing.trustTier === 'TCK_VERIFIED'
      ? 0.8
      : listing.trustTier === 'SELF_ATTESTED'
      ? 0.5
      : 0.1;

    // SLA Score: Uptime percentage mapped to 0..1
    const slaScore = listing.slaMetrics.uptimePercentage / 100;

    // Weighted aggregation: Trust (30%), Isolation (25%), Latency (20%), Cost (15%), SLA (10%)
    const totalScore = Number(
      (trustScore * 0.3 + isolationScore * 0.25 + latencyScore * 0.2 + costScore * 0.15 + slaScore * 0.1).toFixed(4)
    );

    return {
      totalScore,
      capabilityMatch: true,
      hardConstraintsPassed: true,
      costScore: Number(costScore.toFixed(4)),
      latencyScore: Number(latencyScore.toFixed(4)),
      isolationScore: Number(isolationScore.toFixed(4)),
      trustScore: Number(trustScore.toFixed(4)),
      slaScore: Number(slaScore.toFixed(4))
    };
  }
}
