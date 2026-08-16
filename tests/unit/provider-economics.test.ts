import { describe, it, expect } from 'vitest';
import {
  EconomicGovernor,
  type EconomicPricingModel,
  type EvaluationGrantAllocation,
  type DepartmentalCostAllocation,
  type EconomicBudgetCap
} from '../../packages/sandbox-contracts/src/index.js';

describe('SemantIQ Sandbox Phase — Provider Economics & Cost Allocation', () => {
  const governor = new EconomicGovernor();

  const freeCommunityPricing: EconomicPricingModel = {
    tier: 'COMMUNITY_FREE',
    unit: 'SECOND',
    baseUnitPrice: 0,
    currency: 'NONE',
    minBillingIncrementSec: 0,
    egressCostPerGb: 0,
    coldBootSurcharge: 0,
    idleReservationCostPerMin: 0
  };

  const commercialCloudPricing: EconomicPricingModel = {
    tier: 'COMMERCIAL_PAYG',
    unit: 'SECOND',
    baseUnitPrice: 0.0002, // $0.0002 / sec ($0.72 / hr)
    currency: 'USD',
    minBillingIncrementSec: 10,
    egressCostPerGb: 0.08,
    coldBootSurcharge: 0.01,
    idleReservationCostPerMin: 0.005
  };

  const sampleGrant: EvaluationGrantAllocation = {
    grantId: 'grant-nsf-ai-2026',
    sponsorOrganization: 'National Science Foundation AI Pool',
    totalCredits: 100.0,
    remainingCredits: 100.0,
    authorizedBenchmarkSuites: ['swe-bench-verified', 'agent-eval-v1'],
    expiresAt: '2027-12-31T23:59:59Z'
  };

  const sampleDepartment: DepartmentalCostAllocation = {
    costCenter: 'CC-AI-RESEARCH-402',
    projectTag: 'autonomous-systems-eval',
    allocatedBudget: 500.0,
    consumedBudget: 0.0
  };

  it('calculates zero cost for community free and replay trace execution', () => {
    const cost = governor.calculateExecutionCost(freeCommunityPricing, 45000, 1024 * 1024 * 100, true);
    expect(cost.computeCost).toBe(0);
    expect(cost.egressCost).toBe(0);
    expect(cost.coldBootCost).toBe(0);
    expect(cost.totalGrossCost).toBe(0);
    expect(cost.netBilledCost).toBe(0);
  });

  it('calculates commercial pay-as-you-go cost including duration floors, egress, and cold-boot surcharge', () => {
    // Duration: 14.2s -> rounded up to 15s (min increment 10s passed) -> 15 * $0.0002 = $0.003
    // Egress: 2.5 GB -> 2.5 * $0.08 = $0.20
    // Cold Boot: $0.01
    // Gross: $0.003 + $0.20 + $0.01 = $0.213
    const egressBytes = 2.5 * 1024 * 1024 * 1024;
    const cost = governor.calculateExecutionCost(commercialCloudPricing, 14200, egressBytes, true);

    expect(cost.billedDurationMs).toBe(15000);
    expect(cost.computeCost).toBe(0.003);
    expect(cost.egressCost).toBe(0.2);
    expect(cost.coldBootCost).toBe(0.01);
    expect(cost.totalGrossCost).toBe(0.213);
    expect(cost.netBilledCost).toBe(0.213);
  });

  it('applies evaluation grant subsidies and decrements remaining grant credits', () => {
    governor.registerGrant(sampleGrant);

    const egressBytes = 1 * 1024 * 1024 * 1024; // 1 GB ($0.08)
    // Duration: 20s -> 20 * $0.0002 = $0.004
    // Gross: $0.004 + $0.08 = $0.084
    const receipt = governor.issueReceipt(
      'bench-001',
      'scenario-agent-coding',
      'cloud-e2b',
      commercialCloudPricing,
      20000,
      egressBytes,
      false,
      { grantId: 'grant-nsf-ai-2026' }
    );

    expect(receipt.totalGrossCost).toBe(0.084);
    expect(receipt.grantSubsidyApplied).toBe(0.084);
    expect(receipt.netBilledCost).toBe(0);
    expect(receipt.sponsorAttribution).toBe('National Science Foundation AI Pool');

    const updatedGrant = governor.getGrant('grant-nsf-ai-2026');
    expect(updatedGrant?.remainingCredits).toBe(99.916);
  });

  it('tracks departmental budget showback and updates consumed balances', () => {
    governor.registerDepartment(sampleDepartment);

    const receipt = governor.issueReceipt(
      'bench-002',
      'scenario-large-eval',
      'cloud-modal',
      commercialCloudPricing,
      50000, // 50s -> $0.01
      0,
      false,
      { costCenter: 'CC-AI-RESEARCH-402' }
    );

    expect(receipt.costCenter).toBe('CC-AI-RESEARCH-402');
    expect(receipt.netBilledCost).toBe(0.01);

    const updatedDept = governor.getDepartment('CC-AI-RESEARCH-402');
    expect(updatedDept?.consumedBudget).toBe(0.01);
  });

  it('audits benchmark spend and flags runs exceeding budget caps', () => {
    const budgetCap: EconomicBudgetCap = {
      maxSpendPerRun: 0.05,
      maxSpendPerSuite: 1.0,
      currency: 'USD',
      hardCapEnforced: true
    };

    // Issue a small receipt ($0.01)
    governor.issueReceipt(
      'bench-audit-test',
      'scenario-small',
      'cloud-e2b',
      commercialCloudPricing,
      50000,
      0,
      false
    );

    const audit1 = governor.auditBenchmarkSpend('bench-audit-test', budgetCap);
    expect(audit1.isBudgetCompliant).toBe(true);
    expect(audit1.violations.length).toBe(0);

    // Issue an expensive receipt exceeding maxSpendPerRun ($0.10)
    governor.issueReceipt(
      'bench-audit-test',
      'scenario-huge',
      'cloud-e2b',
      commercialCloudPricing,
      500000, // 500s -> $0.10
      0,
      false
    );

    const audit2 = governor.auditBenchmarkSpend('bench-audit-test', budgetCap);
    expect(audit2.isBudgetCompliant).toBe(false);
    expect(audit2.violations.some(v => v.includes('exceeded max spend per run'))).toBe(true);
  });
});
