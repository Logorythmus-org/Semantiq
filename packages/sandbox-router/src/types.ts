/**
 * @package @semantiq/sandbox-router
 * Router Types & Contracts
 */

import type {
  ISandboxProvider,
  ISandboxInstance,
  EnvironmentSpec
} from "../../sandbox-contracts/src/index.js";
import type { ProviderCapabilitiesManifest } from "../../capability-discovery/src/index.js";

export interface TaskTrustContext {
  readonly classification: "TRUSTED_LOCAL" | "UNTRUSTED_COMMUNITY" | "ADVERSARIAL_EVAL";
  readonly requiredIsolationTier: "ROOTLESS_OCI" | "CONTAINER_JAIL" | "HARDWARE_MICROVM";
  readonly allowInternetAccess: boolean;
}

export interface RoutingOptions {
  readonly userPreferredProviderId?: string;
  readonly offlineOnly?: boolean;
  readonly maxSpendUsd?: number;
  readonly maxStartupLatencyMs?: number;
}

export interface RoutingDecision {
  readonly decisionId: string;
  readonly selectedProviderId: string;
  readonly provider: ISandboxProvider;
  readonly failoverChain: readonly {
    readonly providerId: string;
    readonly provider: ISandboxProvider;
  }[];
  readonly scoreBreakdown: {
    readonly totalScore: number;
    readonly hardConstraintsPassed: boolean;
    readonly costScore: number;
    readonly latencyScore: number;
    readonly isolationScore: number;
    readonly preferenceScore: number;
  };
  readonly explanation: string;
  readonly timestamp: string;
}

export interface ISandboxRouter {
  registerProvider(
    provider: ISandboxProvider,
    manifest: ProviderCapabilitiesManifest,
    priority?: number
  ): void;
  unregisterProvider(providerId: string): void;
  evaluateRoute(
    spec: EnvironmentSpec,
    trust: TaskTrustContext,
    options?: RoutingOptions
  ): Promise<RoutingDecision>;
  createRoutedSandbox(
    spec: EnvironmentSpec,
    trust: TaskTrustContext,
    options?: RoutingOptions
  ): Promise<ISandboxInstance>;
}
