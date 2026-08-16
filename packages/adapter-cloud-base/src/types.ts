/**
 * @package @tech-club/adapter-cloud-base
 * Cloud Provider Types & Contracts
 */

export interface CloudAuthConfig {
  readonly apiKey: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly region?: string;
  readonly customEndpoint?: string;
}

export interface CloudBudgetPolicy {
  readonly maxSpendPerRunUsd: number;
  readonly maxCostPerMinuteUsd: number;
  readonly maxConcurrentSandboxes: number;
  readonly autoAbortOnSpendLimit: boolean;
}

export interface CloudBillingMetadata {
  readonly providerName: string;
  readonly instanceTier: string;
  readonly billedExecutionDurationMs: number;
  readonly wallClockDurationMs: number;
  readonly estimatedCostUsd: number;
  readonly currency: 'USD';
  readonly zeroDataRetentionConfirmed: boolean;
}
