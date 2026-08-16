/**
 * @package @semantiq/sandbox-router
 * Multi-Criteria Provider Selection Router
 */

import type { ISandboxRouter, RoutingDecision, TaskTrustContext, RoutingOptions } from "./types.js";
import type {
  ISandboxProvider,
  ISandboxInstance,
  EnvironmentSpec
} from "../../sandbox-contracts/src/index.js";
import type { ProviderCapabilitiesManifest } from "../../capability-discovery/src/index.js";

interface ProviderEntry {
  readonly provider: ISandboxProvider;
  readonly manifest: ProviderCapabilitiesManifest;
  readonly priority: number;
}

export class ProviderSelectionRouter implements ISandboxRouter {
  private readonly providers: Map<string, ProviderEntry> = new Map();
  private readonly circuitBreakers: Map<string, { failureCount: number; openUntil: number }> =
    new Map();

  registerProvider(
    provider: ISandboxProvider,
    manifest: ProviderCapabilitiesManifest,
    priority = 50
  ): void {
    this.providers.set(provider.providerId, { provider, manifest, priority });
  }

  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
    this.circuitBreakers.delete(providerId);
  }

  async evaluateRoute(
    spec: EnvironmentSpec,
    trust: TaskTrustContext,
    options?: RoutingOptions
  ): Promise<RoutingDecision> {
    const candidates: {
      providerId: string;
      provider: ISandboxProvider;
      score: number;
      details: any;
    }[] = [];

    for (const [id, entry] of this.providers.entries()) {
      // Circuit Breaker Check
      if (this.isCircuitOpen(id)) continue;

      // Offline Strict Check
      if (options?.offlineOnly && (id.startsWith("cloud-") || id === "e2b")) continue;

      // Hard Constraints & Trust Boundary Check
      const hardCheck = this.evaluateHardConstraints(spec, trust, entry.manifest);
      if (!hardCheck.passed) continue;

      // MCDM Utility Scoring
      const scoreData = this.calculateScore(entry, options);
      candidates.push({
        providerId: id,
        provider: entry.provider,
        score: scoreData.total,
        details: scoreData
      });
    }

    if (candidates.length === 0) {
      throw new Error(
        `No available provider satisfies task constraints for trust tier: ${trust.classification}`
      );
    }

    candidates.sort((a, b) => b.score - a.score);

    const primary = candidates[0]!;
    const failoverChain = candidates
      .slice(1)
      .map((c) => ({ providerId: c.providerId, provider: c.provider }));

    return {
      decisionId: crypto.randomUUID(),
      selectedProviderId: primary.providerId,
      provider: primary.provider,
      failoverChain,
      scoreBreakdown: primary.details,
      explanation: `Selected '${primary.providerId}' with score ${primary.score.toFixed(2)}. Passed all hard constraints.`,
      timestamp: new Date().toISOString()
    };
  }

  async createRoutedSandbox(
    spec: EnvironmentSpec,
    trust: TaskTrustContext,
    options?: RoutingOptions
  ): Promise<ISandboxInstance> {
    const decision = await this.evaluateRoute(spec, trust, options);

    try {
      return await decision.provider.createSandbox(spec);
    } catch {
      this.recordFailure(decision.selectedProviderId);

      // Attempt failover chain
      for (const fallback of decision.failoverChain) {
        try {
          return await fallback.provider.createSandbox(spec);
        } catch {
          this.recordFailure(fallback.providerId);
        }
      }

      throw new Error(`Execution failed across all routed providers in failover chain.`);
    }
  }

  private evaluateHardConstraints(
    spec: EnvironmentSpec,
    trust: TaskTrustContext,
    manifest: ProviderCapabilitiesManifest
  ): { passed: boolean } {
    if (spec.resources.memoryLimitMebibytes > manifest.compute.maxMemoryMb)
      return { passed: false };

    if (
      spec.security.networkMode !== "none" &&
      !manifest.network.egressWhitelist &&
      !trust.allowInternetAccess
    ) {
      return { passed: false };
    }

    const tierRanks: Record<string, number> = {
      ROOTLESS_OCI: 1,
      CONTAINER_JAIL: 2,
      HARDWARE_MICROVM: 3,
      MOCK_REPLAY: 0
    };

    const requiredRank = tierRanks[trust.requiredIsolationTier] ?? 1;
    const providerRank = tierRanks[manifest.isolation.tier] ?? 1;

    if (providerRank < requiredRank && manifest.isolation.tier !== "MOCK_REPLAY") {
      return { passed: false };
    }

    return { passed: true };
  }

  private calculateScore(entry: ProviderEntry, options?: RoutingOptions): any {
    const isPreferred = options?.userPreferredProviderId === entry.provider.providerId;
    const prefScore = isPreferred ? 1.0 : entry.priority / 100;
    const latScore = 1.0 - Math.min(1.0, entry.manifest.compute.typicalColdBootLatencyMs / 5000);
    const isoScore = entry.manifest.isolation.tier === "HARDWARE_MICROVM" ? 1.0 : 0.5;
    const costScore =
      entry.provider.providerId.startsWith("cloud-") || entry.provider.providerId === "e2b"
        ? 0.4
        : 1.0;

    const total = prefScore * 0.3 + costScore * 0.25 + latScore * 0.25 + isoScore * 0.2;
    return {
      total,
      costScore,
      latencyScore: latScore,
      isolationScore: isoScore,
      preferenceScore: prefScore,
      hardConstraintsPassed: true
    };
  }

  private isCircuitOpen(providerId: string): boolean {
    const cb = this.circuitBreakers.get(providerId);
    if (!cb) return false;
    if (Date.now() < cb.openUntil) return true;
    this.circuitBreakers.delete(providerId);
    return false;
  }

  private recordFailure(providerId: string): void {
    const current = this.circuitBreakers.get(providerId) || { failureCount: 0, openUntil: 0 };
    current.failureCount += 1;
    if (current.failureCount >= 3) {
      current.openUntil = Date.now() + 60000;
    }
    this.circuitBreakers.set(providerId, current);
  }
}
