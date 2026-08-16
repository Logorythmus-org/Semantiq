/**
 * @package @semantiq/adapter-cloud-base
 * Cost & Quota Governor for Cloud Sandboxes
 */

import { SandboxRuntimeError } from "../../sandbox-contracts/src/index.js";
import type { CloudBudgetPolicy } from "./types.js";

export class CostQuotaGovernor {
  private policy: CloudBudgetPolicy;
  private totalSpendUsd = 0;
  private activeSandboxesCount = 0;

  constructor(policy?: Partial<CloudBudgetPolicy>) {
    this.policy = {
      maxSpendPerRunUsd: policy?.maxSpendPerRunUsd ?? 5.0,
      maxCostPerMinuteUsd: policy?.maxCostPerMinuteUsd ?? 0.5,
      maxConcurrentSandboxes: policy?.maxConcurrentSandboxes ?? 10,
      autoAbortOnSpendLimit: policy?.autoAbortOnSpendLimit ?? true
    };
  }

  setPolicy(policy: CloudBudgetPolicy): void {
    this.policy = policy;
  }

  getSpend(): { totalSpendUsd: number; activeSandboxesCount: number } {
    return {
      totalSpendUsd: this.totalSpendUsd,
      activeSandboxesCount: this.activeSandboxesCount
    };
  }

  checkPreflight(): void {
    if (this.activeSandboxesCount >= this.policy.maxConcurrentSandboxes) {
      throw new SandboxRuntimeError(
        "ERR_CLOUD_CONCURRENCY_EXCEEDED",
        `Active cloud sandboxes (${this.activeSandboxesCount}) reached limit (${this.policy.maxConcurrentSandboxes})`,
        "cloud-governor",
        true
      );
    }

    if (this.totalSpendUsd >= this.policy.maxSpendPerRunUsd) {
      throw new SandboxRuntimeError(
        "ERR_PROV_BUDGET_EXCEEDED",
        `Cloud spend ($${this.totalSpendUsd.toFixed(4)}) reached budget ceiling ($${this.policy.maxSpendPerRunUsd.toFixed(2)})`,
        "cloud-governor",
        false
      );
    }
  }

  onSandboxCreated(): void {
    this.activeSandboxesCount++;
  }

  onSandboxTerminated(billedDurationMs: number, costPerMinuteUsd = 0.03): number {
    this.activeSandboxesCount = Math.max(0, this.activeSandboxesCount - 1);
    const cost = (billedDurationMs / 60000) * costPerMinuteUsd;
    this.totalSpendUsd += cost;
    return cost;
  }
}
