import { describe, it, expect } from "vitest";
import {
  ExecutionCostCalculator,
  type CostRatesConfig,
  type HolisticExecutionCostLedger
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — 8-Vector Holistic Execution Cost Model", () => {
  const calculator = new ExecutionCostCalculator();

  const standardRates: CostRatesConfig = {
    inferenceRatePer1kTokens: {
      prompt: 0.003, // $3 / 1M prompt
      completion: 0.015, // $15 / 1M completion
      reasoning: 0.02, // $20 / 1M reasoning
      cached: 0.0015 // $1.5 / 1M cached
    },
    computeRatePerCoreSecond: 0.00005,
    computeRatePerGibSecond: 0.00001,
    coldBootSurcharge: 0.01,
    browserRatePerMinute: 0.02,
    gpuRatePerHour: 2.5, // A100 $2.50/hr
    storageRatePerGbMonth: 0.1,
    egressRatePerGb: 0.08,
    mcpToolCallRate: 0.001,
    paidApiCallRate: 0.005,
    judgeRatePer1kTokens: 0.005
  };

  const zeroLocalRates: CostRatesConfig = {
    inferenceRatePer1kTokens: { prompt: 0, completion: 0, reasoning: 0, cached: 0 },
    computeRatePerCoreSecond: 0,
    computeRatePerGibSecond: 0,
    coldBootSurcharge: 0,
    browserRatePerMinute: 0,
    gpuRatePerHour: 0,
    storageRatePerGbMonth: 0,
    egressRatePerGb: 0,
    mcpToolCallRate: 0,
    paidApiCallRate: 0,
    judgeRatePer1kTokens: 0
  };

  it("calculates comprehensive cost ledger across all 8 dimensions with cryptographic signature", () => {
    const egressBytes = 2 * 1024 * 1024 * 1024; // 2 GB ($0.16)

    const ledger = calculator.calculateLedger(
      "run-eval-001",
      "bench-swe-verified",
      "scenario-django-fix",
      standardRates,
      {
        modelId: "gemini-1.5-pro",
        promptTokens: 10000, // $0.03
        completionTokens: 2000, // $0.03
        reasoningTokens: 1000, // $0.02
        cachedTokens: 4000, // $0.006 -> Inference: $0.086
        providerId: "provider-e2b-cloud",
        cpuCoreSeconds: 120, // 120 * $0.00005 = $0.006
        ramGibSeconds: 240, // 240 * $0.00001 = $0.0024
        wallClockDurationMs: 60000,
        isColdBoot: true, // $0.01 -> Compute: $0.0184
        browserSessions: 1,
        browserActiveMs: 30000, // 0.5 min * $0.02 = $0.01 -> Browser: $0.01
        gpuType: "NVIDIA-A100",
        allocatedGpus: 1,
        gpuDurationMs: 1800000, // 0.5 hr * $2.50 = $1.25 -> GPU: $1.25
        diskAllocatedGb: 20,
        snapshotCount: 2,
        egressBytes, // 2 GB * $0.08 = $0.16 -> Network: $0.16
        mcpToolCalls: 5, // 5 * $0.001 = $0.005
        paidApiCalls: 2, // 2 * $0.005 = $0.01 -> Tools: $0.015
        judgeModelId: "eval-judge-gpt4o",
        judgeTokens: 1000, // 1k * $0.005 = $0.005 -> Evaluation: $0.005
        grantSubsidiesUsd: 0.5
      }
    );

    expect(ledger.runId).toBe("run-eval-001");
    expect(ledger.inference.costUsd).toBe(0.086);
    expect(ledger.runtimeCompute.costUsd).toBe(0.0184);
    expect(ledger.browserGui.costUsd).toBe(0.01);
    expect(ledger.gpu.costUsd).toBe(1.25);
    expect(ledger.network.costUsd).toBe(0.16);
    expect(ledger.tools.costUsd).toBe(0.015);
    expect(ledger.evaluation.costUsd).toBe(0.005);

    expect(ledger.totalGrossCostUsd).toBeGreaterThan(1.5);
    expect(ledger.grantSubsidiesUsd).toBe(0.5);
    expect(ledger.totalNetCostUsd).toBe(Number((ledger.totalGrossCostUsd - 0.5).toFixed(6)));
    expect(ledger.ledgerSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("calculates zero cost for local open-source execution while preserving metric accounting", () => {
    const ledger = calculator.calculateLedger(
      "run-local-002",
      "bench-local-test",
      "scenario-1",
      zeroLocalRates,
      {
        modelId: "local-llama-3",
        promptTokens: 5000,
        completionTokens: 500,
        providerId: "provider-docker-local",
        cpuCoreSeconds: 50,
        ramGibSeconds: 100,
        wallClockDurationMs: 25000,
        isColdBoot: false
      }
    );

    expect(ledger.totalGrossCostUsd).toBe(0);
    expect(ledger.totalNetCostUsd).toBe(0);
    expect(ledger.inference.promptTokens).toBe(5000);
    expect(ledger.runtimeCompute.cpuCoreSeconds).toBe(50);
  });

  it("generates structured Markdown cost report for evaluation transparency", () => {
    const ledger = calculator.calculateLedger(
      "run-report-test",
      "bench-swe-verified",
      "scenario-django-fix",
      standardRates,
      {
        modelId: "gemini-1.5-flash",
        promptTokens: 1000,
        completionTokens: 200,
        providerId: "provider-docker-local",
        cpuCoreSeconds: 10,
        ramGibSeconds: 20,
        wallClockDurationMs: 5000,
        isColdBoot: false
      }
    );

    const report = calculator.generateCostReportMarkdown(ledger);
    expect(report).toContain("# Holistic Execution Cost Ledger");
    expect(report).toContain("run-report-test");
    expect(report).toContain("Total Gross Cost");
    expect(report).toContain("Total Net Cost");
    expect(report).toContain("Cryptographic Ledger Signature");
  });
});
