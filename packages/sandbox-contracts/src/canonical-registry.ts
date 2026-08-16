/**
 * @package @tech-club/sandbox-contracts
 * Canonical Machine-Readable Provider Registry Architecture
 */

import type { SandboxCapabilities } from './types.js';
import type { ProviderTrustTier, SecurityPostureGrade } from './trust-verification.js';
import type { MarketplaceDeploymentMode, ProviderSlaMetrics } from './marketplace.js';
import type { EconomicPricingModel } from './economics.js';
import type { ProviderLicensingManifest } from './licensing-boundary.js';
import { canonicalJson, computeSha256 } from './crypto-utils.js';

export type ProviderReleaseChannel =
  | 'STABLE'
  | 'BETA'
  | 'EXPERIMENTAL'
  | 'DEPRECATED';

export type ProviderOperationalStatus =
  | 'ONLINE'
  | 'DEGRADED'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'QUARANTINED';

export type TransportProtocol =
  | 'LOCAL_SOCKET'
  | 'HTTP_REST'
  | 'GRPC'
  | 'STDIO_SUBPROCESS';

export interface ProviderEndpointConfig {
  readonly primaryUrl: string;
  readonly backupUrls?: readonly string[] | undefined;
  readonly transport: TransportProtocol;
  readonly healthCheckUrl?: string | undefined;
  readonly timeoutMs: number;
}

export interface CanonicalProviderRegistryEntry {
  readonly providerId: string;
  readonly displayName: string;
  readonly organization: string;
  readonly version: string;
  readonly releaseChannel: ProviderReleaseChannel;
  readonly deploymentMode: MarketplaceDeploymentMode;
  readonly endpoints: ProviderEndpointConfig;
  readonly capabilities: SandboxCapabilities;
  readonly licensing: ProviderLicensingManifest;
  readonly trustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly pricing: EconomicPricingModel;
  readonly sla: ProviderSlaMetrics;
  readonly status: ProviderOperationalStatus;
  readonly consecutiveFailures: number;
  readonly tags: readonly string[];
  readonly registeredAt: string;
  readonly lastHeartbeatAt: string;
  readonly signatureHex: string;
}

export interface CanonicalRegistryQuery {
  readonly allowedDeploymentModes?: readonly MarketplaceDeploymentMode[] | undefined;
  readonly allowedReleaseChannels?: readonly ProviderReleaseChannel[] | undefined;
  readonly minTrustTier?: ProviderTrustTier | undefined;
  readonly minSecurityGrade?: SecurityPostureGrade | undefined;
  readonly maxBaseCost?: number | undefined;
  readonly maxColdBootLatencyMs?: number | undefined;
  readonly statusFilter?: readonly ProviderOperationalStatus[] | undefined;
  readonly offlineOnly?: boolean | undefined;
  readonly requiredCapabilities?: Partial<SandboxCapabilities> | undefined;
  readonly tags?: readonly string[] | undefined;
}

export interface RegistryRegistrationReport {
  readonly providerId: string;
  readonly isSuccess: boolean;
  readonly entrySha256: string;
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
  readonly registeredAt: string;
}

export interface ProviderRegistryEvent {
  readonly eventId: string;
  readonly providerId: string;
  readonly eventType: 'REGISTERED' | 'HEALTH_UPDATED' | 'STATUS_CHANGED' | 'DEPRECATED' | 'DEREGISTERED';
  readonly previousStatus?: ProviderOperationalStatus | undefined;
  readonly currentStatus: ProviderOperationalStatus;
  readonly details: string;
  readonly timestamp: string;
}

/**
 * Canonical Provider Registry Engine.
 * Authoritative in-memory registry holding validated provider descriptors,
 * managing operational state machines, query resolution, and cryptographic verification.
 */
export class CanonicalProviderRegistry {
  private readonly entries: Map<string, CanonicalProviderRegistryEntry> = new Map();
  private readonly eventLog: ProviderRegistryEvent[] = [];

  register(entry: CanonicalProviderRegistryEntry): RegistryRegistrationReport {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. Identity & Naming
    if (!entry.providerId || entry.providerId.trim().length === 0) {
      violations.push('Provider ID is missing.');
    }
    if (!entry.version || entry.version.trim().length === 0) {
      violations.push('Provider version is missing.');
    }

    // 2. Endpoints
    if (!entry.endpoints.primaryUrl || entry.endpoints.primaryUrl.trim().length === 0) {
      violations.push('Primary endpoint URL is missing.');
    }

    // 3. Cryptographic Signature
    if (!entry.signatureHex || entry.signatureHex.length < 64) {
      violations.push('Cryptographic signature is missing or malformed.');
    }

    // 4. Release Channel & Status
    if (entry.releaseChannel === 'DEPRECATED') {
      warnings.push(`Provider '${entry.providerId}' is marked as DEPRECATED.`);
    }

    // 5. Licensing Clean-Room Verification
    if (!entry.licensing.isCleanRoomImplementation) {
      violations.push('Provider licensing manifest is not clean-room verified.');
    }

    const isSuccess = violations.length === 0;
    const entryDigest = computeSha256(canonicalJson(entry));

    if (isSuccess) {
      this.entries.set(entry.providerId, entry);
      this.emitEvent({
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        providerId: entry.providerId,
        eventType: 'REGISTERED',
        currentStatus: entry.status,
        details: `Provider '${entry.displayName}' registered successfully on channel ${entry.releaseChannel}.`,
        timestamp: new Date().toISOString()
      });
    }

    return {
      providerId: entry.providerId,
      isSuccess,
      entrySha256: `sha256:${entryDigest}`,
      violations,
      warnings,
      registeredAt: new Date().toISOString()
    };
  }

  deregister(providerId: string): boolean {
    const existing = this.entries.get(providerId);
    if (!existing) return false;

    this.entries.delete(providerId);
    this.emitEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      providerId,
      eventType: 'DEREGISTERED',
      previousStatus: existing.status,
      currentStatus: 'OFFLINE',
      details: `Provider '${providerId}' deregistered from canonical registry.`,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  getEntry(providerId: string): CanonicalProviderRegistryEntry | undefined {
    return this.entries.get(providerId);
  }

  listEntries(): readonly CanonicalProviderRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  updateHealth(
    providerId: string,
    status: ProviderOperationalStatus,
    consecutiveFailures = 0
  ): boolean {
    const existing = this.entries.get(providerId);
    if (!existing) return false;

    const previousStatus = existing.status;
    const updated: CanonicalProviderRegistryEntry = {
      ...existing,
      status,
      consecutiveFailures,
      lastHeartbeatAt: new Date().toISOString()
    };

    this.entries.set(providerId, updated);

    if (previousStatus !== status) {
      this.emitEvent({
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        providerId,
        eventType: 'STATUS_CHANGED',
        previousStatus,
        currentStatus: status,
        details: `Operational status transitioned from ${previousStatus} to ${status}.`,
        timestamp: new Date().toISOString()
      });
    }

    return true;
  }

  find(query: CanonicalRegistryQuery): readonly CanonicalProviderRegistryEntry[] {
    const results: CanonicalProviderRegistryEntry[] = [];

    const trustRanks: Record<ProviderTrustTier, number> = {
      UNVERIFIED: 0,
      SELF_ATTESTED: 1,
      TCK_VERIFIED: 2,
      CRYPTOGRAPHICALLY_CERTIFIED: 3
    };

    const gradeRanks: Record<SecurityPostureGrade, number> = {
      F_UNCONFINED: 0,
      C_RESTRICTED_PROCESS: 1,
      B_ISOLATED_CONTAINER: 2,
      A_HARDENED_MICROVM: 3
    };

    for (const entry of this.entries.values()) {
      // 1. Status Filter (default: omit OFFLINE or QUARANTINED unless requested)
      if (query.statusFilter && query.statusFilter.length > 0) {
        if (!query.statusFilter.includes(entry.status)) continue;
      } else {
        if (entry.status === 'OFFLINE' || entry.status === 'QUARANTINED') continue;
      }

      // 2. Offline Only
      if (query.offlineOnly && (entry.deploymentMode === 'MANAGED_MULTI_TENANT' || entry.deploymentMode === 'SERVERLESS_MICROVM')) {
        continue;
      }

      // 3. Deployment Modes
      if (query.allowedDeploymentModes && query.allowedDeploymentModes.length > 0) {
        if (!query.allowedDeploymentModes.includes(entry.deploymentMode)) continue;
      }

      // 4. Release Channel
      if (query.allowedReleaseChannels && query.allowedReleaseChannels.length > 0) {
        if (!query.allowedReleaseChannels.includes(entry.releaseChannel)) continue;
      }

      // 5. Trust Tier
      if (query.minTrustTier && trustRanks[entry.trustTier] < trustRanks[query.minTrustTier]) {
        continue;
      }

      // 6. Security Grade
      if (query.minSecurityGrade && gradeRanks[entry.securityGrade] < gradeRanks[query.minSecurityGrade]) {
        continue;
      }

      // 7. Cost Ceiling
      if (query.maxBaseCost !== undefined && entry.pricing.baseUnitPrice > query.maxBaseCost) {
        continue;
      }

      // 8. Latency Ceiling
      if (query.maxColdBootLatencyMs !== undefined && entry.sla.p50ColdBootLatencyMs > query.maxColdBootLatencyMs) {
        continue;
      }

      // 9. Required Capabilities
      if (query.requiredCapabilities) {
        const rc = query.requiredCapabilities;
        if (rc.supportsMicroVM && !entry.capabilities.supportsMicroVM) continue;
        if (rc.supportsSnapshots && !entry.capabilities.supportsSnapshots) continue;
        if (rc.supportsFilesystemDiff && !entry.capabilities.supportsFilesystemDiff) continue;
        if (rc.supportsNetworkPolicy && !entry.capabilities.supportsNetworkPolicy) continue;
      }

      // 10. Tags
      if (query.tags && query.tags.length > 0) {
        const hasAllTags = query.tags.every(t => entry.tags.includes(t));
        if (!hasAllTags) continue;
      }

      results.push(entry);
    }

    return results;
  }

  getEventLog(): readonly ProviderRegistryEvent[] {
    return this.eventLog;
  }

  private emitEvent(event: ProviderRegistryEvent): void {
    this.eventLog.push(event);
  }
}
