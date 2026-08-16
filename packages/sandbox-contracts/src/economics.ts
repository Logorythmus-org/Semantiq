/**
 * @package @semantiq/sandbox-contracts
 * Provider Economics, Sustainable Funding, and Cost Allocation Architecture
 */

export type EconomicTier =
  "COMMUNITY_FREE" | "SPONSORED_GRANT" | "COMMERCIAL_PAYG" | "ENTERPRISE_RESERVED" | "REPLAY_TRACE";

export type EconomicBillingUnit = "SECOND" | "MINUTE" | "HOUR" | "RUN" | "TOKEN_ESTIMATE";

export interface EconomicPricingModel {
  readonly tier: EconomicTier;
  readonly unit: EconomicBillingUnit;
  readonly baseUnitPrice: number;
  readonly currency: "USD" | "EUR" | "CREDITS" | "NONE";
  readonly minBillingIncrementSec: number;
  readonly egressCostPerGb: number;
  readonly coldBootSurcharge: number;
  readonly idleReservationCostPerMin: number;
}

export interface EvaluationGrantAllocation {
  readonly grantId: string;
  readonly sponsorOrganization: string;
  readonly totalCredits: number;
  readonly remainingCredits: number;
  readonly authorizedBenchmarkSuites: readonly string[];
  readonly expiresAt: string;
}

export interface DepartmentalCostAllocation {
  readonly costCenter: string;
  readonly projectTag: string;
  readonly allocatedBudget: number;
  readonly consumedBudget: number;
}

export interface EconomicBudgetCap {
  readonly maxSpendPerRun: number;
  readonly maxSpendPerSuite: number;
  readonly maxMonthlyBudget?: number | undefined;
  readonly currency: string;
  readonly hardCapEnforced: boolean;
}

export interface EconomicExecutionReceipt {
  readonly receiptId: string;
  readonly benchmarkId: string;
  readonly scenarioId: string;
  readonly providerId: string;
  readonly economicTier: EconomicTier;
  readonly billedDurationMs: number;
  readonly computeCost: number;
  readonly egressCost: number;
  readonly coldBootCost: number;
  readonly totalGrossCost: number;
  readonly grantSubsidyApplied: number;
  readonly netBilledCost: number;
  readonly currency: string;
  readonly sponsorAttribution?: string | undefined;
  readonly costCenter?: string | undefined;
  readonly timestamp: string;
  readonly receiptSignatureHex: string;
}

export interface EconomicAuditReport {
  readonly benchmarkId: string;
  readonly isBudgetCompliant: boolean;
  readonly totalRunsAudited: number;
  readonly totalGrossSpend: number;
  readonly totalSubsidies: number;
  readonly totalNetSpend: number;
  readonly violations: readonly string[];
  readonly auditedAt: string;
}

/**
 * Economic Governor & Cost Allocation Engine.
 * Manages pre-flight budget reservations, grant deduction,
 * commercial billing calculations, and departmental showback.
 */
export class EconomicGovernor {
  private readonly grants: Map<string, EvaluationGrantAllocation> = new Map();
  private readonly departmentalBudgets: Map<string, DepartmentalCostAllocation> = new Map();
  private readonly receipts: EconomicExecutionReceipt[] = [];

  registerGrant(grant: EvaluationGrantAllocation): void {
    this.grants.set(grant.grantId, grant);
  }

  getGrant(grantId: string): EvaluationGrantAllocation | undefined {
    return this.grants.get(grantId);
  }

  registerDepartment(dept: DepartmentalCostAllocation): void {
    this.departmentalBudgets.set(dept.costCenter, dept);
  }

  getDepartment(costCenter: string): DepartmentalCostAllocation | undefined {
    return this.departmentalBudgets.get(costCenter);
  }

  calculateExecutionCost(
    pricing: EconomicPricingModel,
    executionDurationMs: number,
    networkEgressBytes = 0,
    isColdBoot = false,
    grantId?: string
  ): {
    billedDurationMs: number;
    computeCost: number;
    egressCost: number;
    coldBootCost: number;
    totalGrossCost: number;
    grantSubsidyApplied: number;
    netBilledCost: number;
  } {
    if (pricing.tier === "COMMUNITY_FREE" || pricing.tier === "REPLAY_TRACE") {
      return {
        billedDurationMs: executionDurationMs,
        computeCost: 0,
        egressCost: 0,
        coldBootCost: 0,
        totalGrossCost: 0,
        grantSubsidyApplied: 0,
        netBilledCost: 0
      };
    }

    let billedDurationMs = executionDurationMs;
    let computeCost = 0;

    if (pricing.unit === "SECOND") {
      const durationSec = Math.max(
        pricing.minBillingIncrementSec,
        Math.ceil(executionDurationMs / 1000)
      );
      billedDurationMs = durationSec * 1000;
      computeCost = durationSec * pricing.baseUnitPrice;
    } else if (pricing.unit === "MINUTE") {
      const durationMin = Math.max(
        Math.ceil(pricing.minBillingIncrementSec / 60),
        Math.ceil(executionDurationMs / 60000)
      );
      billedDurationMs = durationMin * 60000;
      computeCost = durationMin * pricing.baseUnitPrice;
    } else if (pricing.unit === "HOUR") {
      const durationHr = Math.max(
        pricing.minBillingIncrementSec / 3600,
        executionDurationMs / 3600000
      );
      billedDurationMs = Math.ceil(durationHr * 3600) * 1000;
      computeCost = durationHr * pricing.baseUnitPrice;
    } else if (pricing.unit === "RUN") {
      computeCost = pricing.baseUnitPrice;
    }

    const egressGb = networkEgressBytes / (1024 * 1024 * 1024);
    const egressCost = egressGb * pricing.egressCostPerGb;
    const coldBootCost = isColdBoot ? pricing.coldBootSurcharge : 0;
    const totalGrossCost = Number((computeCost + egressCost + coldBootCost).toFixed(6));

    let grantSubsidyApplied = 0;
    let netBilledCost = totalGrossCost;

    if (grantId && this.grants.has(grantId)) {
      const grant = this.grants.get(grantId)!;
      if (grant.remainingCredits > 0 && new Date(grant.expiresAt).getTime() > Date.now()) {
        grantSubsidyApplied = Math.min(grant.remainingCredits, totalGrossCost);
        netBilledCost = Number((totalGrossCost - grantSubsidyApplied).toFixed(6));

        // Deduct from grant
        this.grants.set(grantId, {
          ...grant,
          remainingCredits: Number((grant.remainingCredits - grantSubsidyApplied).toFixed(6))
        });
      }
    }

    return {
      billedDurationMs,
      computeCost: Number(computeCost.toFixed(6)),
      egressCost: Number(egressCost.toFixed(6)),
      coldBootCost: Number(coldBootCost.toFixed(6)),
      totalGrossCost,
      grantSubsidyApplied: Number(grantSubsidyApplied.toFixed(6)),
      netBilledCost
    };
  }

  issueReceipt(
    benchmarkId: string,
    scenarioId: string,
    providerId: string,
    pricing: EconomicPricingModel,
    executionDurationMs: number,
    networkEgressBytes = 0,
    isColdBoot = false,
    options?: { grantId?: string; costCenter?: string }
  ): EconomicExecutionReceipt {
    const costBreakdown = this.calculateExecutionCost(
      pricing,
      executionDurationMs,
      networkEgressBytes,
      isColdBoot,
      options?.grantId
    );

    const grant = options?.grantId ? this.grants.get(options.grantId) : undefined;

    // Apply departmental showback if cost center specified
    if (options?.costCenter && this.departmentalBudgets.has(options.costCenter)) {
      const dept = this.departmentalBudgets.get(options.costCenter)!;
      this.departmentalBudgets.set(options.costCenter, {
        ...dept,
        consumedBudget: Number((dept.consumedBudget + costBreakdown.netBilledCost).toFixed(6))
      });
    }

    const receipt: EconomicExecutionReceipt = {
      receiptId: `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      benchmarkId,
      scenarioId,
      providerId,
      economicTier: pricing.tier,
      billedDurationMs: costBreakdown.billedDurationMs,
      computeCost: costBreakdown.computeCost,
      egressCost: costBreakdown.egressCost,
      coldBootCost: costBreakdown.coldBootCost,
      totalGrossCost: costBreakdown.totalGrossCost,
      grantSubsidyApplied: costBreakdown.grantSubsidyApplied,
      netBilledCost: costBreakdown.netBilledCost,
      currency: pricing.currency,
      sponsorAttribution: grant?.sponsorOrganization,
      costCenter: options?.costCenter,
      timestamp: new Date().toISOString(),
      receiptSignatureHex:
        "3045022100rcptecon0123456789abcdef0123456789abcdef0123456789abcdef0220rcptecon0123456789abcdef0123456789abcdef0123456789abcdef"
    };

    this.receipts.push(receipt);
    return receipt;
  }

  auditBenchmarkSpend(benchmarkId: string, budgetCap?: EconomicBudgetCap): EconomicAuditReport {
    const relevantReceipts = this.receipts.filter((r) => r.benchmarkId === benchmarkId);
    const violations: string[] = [];

    let totalGrossSpend = 0;
    let totalSubsidies = 0;
    let totalNetSpend = 0;

    for (const r of relevantReceipts) {
      totalGrossSpend += r.totalGrossCost;
      totalSubsidies += r.grantSubsidyApplied;
      totalNetSpend += r.netBilledCost;

      if (budgetCap?.maxSpendPerRun && r.netBilledCost > budgetCap.maxSpendPerRun) {
        violations.push(
          `Run ${r.scenarioId} exceeded max spend per run ($${r.netBilledCost.toFixed(2)} > $${budgetCap.maxSpendPerRun.toFixed(2)}).`
        );
      }
    }

    if (budgetCap?.maxSpendPerSuite && totalNetSpend > budgetCap.maxSpendPerSuite) {
      violations.push(
        `Benchmark ${benchmarkId} total net spend ($${totalNetSpend.toFixed(2)}) exceeded suite budget cap ($${budgetCap.maxSpendPerSuite.toFixed(2)}).`
      );
    }

    return {
      benchmarkId,
      isBudgetCompliant: violations.length === 0,
      totalRunsAudited: relevantReceipts.length,
      totalGrossSpend: Number(totalGrossSpend.toFixed(6)),
      totalSubsidies: Number(totalSubsidies.toFixed(6)),
      totalNetSpend: Number(totalNetSpend.toFixed(6)),
      violations,
      auditedAt: new Date().toISOString()
    };
  }
}
