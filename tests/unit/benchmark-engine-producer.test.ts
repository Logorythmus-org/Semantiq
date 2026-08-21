import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BenchmarkProducerEngine,
  BenchmarkContractAdapter,
  type BenchmarkExecutionOutput
} from "../../packages/benchmark/src/index.js";
import {
  EvaluationStatus,
  ProductRunStatus
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("SemantIQ Benchmark Engine & Producer Layer", () => {
  const engine = new BenchmarkProducerEngine();
  const adapter = new BenchmarkContractAdapter();

  it("executes SMF semantic reasoning benchmark and yields canonical adapted contracts", async () => {
    const result = await engine.executeBenchmark({
      family: "smf",
      systemProfile: {
        id: "sys_prof_claude_3_5_sonnet",
        version: "1.0.0",
        name: "Claude 3.5 Sonnet",
        modelFamily: "claude",
        modelId: "anthropic/claude-3-5-sonnet",
        parameters: { temperature: 0 },
        capabilities: ["tool_calling"],
        contextWindowTokens: 200000,
        createdAt: "2026-08-18T12:00:00.000Z"
      }
    });

    expect(result.run.benchmarkId).toBe("bmk_smf_evaluation_v1");
    expect(result.run.status).toBe(ProductRunStatus.COMPLETED);
    expect(result.evaluation.status).toBe(EvaluationStatus.PASSED);
    expect(result.evaluation.overallScore).toBeGreaterThan(0.85);
    expect(result.evaluation.scoreBreakdown["reasoning-depth"]).toBeDefined();
    expect(result.observations.length).toBe(1);
    expect(result.provenance.merkleRootHash).toHaveLength(64);
  });

  it("executes HACS sandbox agent resilience benchmark and yields canonical adapted contracts", async () => {
    const result = await engine.executeBenchmark({
      family: "hacs",
      systemProfile: {
        id: "sys_prof_gpt_4o",
        version: "1.0.0",
        name: "GPT-4o",
        modelFamily: "gpt",
        modelId: "openai/gpt-4o",
        parameters: { temperature: 0 },
        capabilities: ["tool_calling"],
        contextWindowTokens: 128000,
        createdAt: "2026-08-18T12:00:00.000Z"
      }
    });

    expect(result.run.benchmarkId).toBe("bmk_hacs_evaluation_v1");
    expect(result.run.status).toBe(ProductRunStatus.COMPLETED);
    expect(result.evaluation.scoreBreakdown["long-horizon-resilience"]).toBeDefined();
    expect(result.evaluation.scoreBreakdown["anti-gaming-authenticity"]?.score).toBe(1.0);
    expect(result.provenance.executionReceiptId).toMatch(/^receipt_run_hacs_/);
  });

  it("executes Vision multimodal grounding benchmark and yields canonical adapted contracts", async () => {
    const result = await engine.executeBenchmark({
      family: "vision",
      systemProfile: {
        id: "sys_prof_gemini_1_5_pro",
        version: "1.0.0",
        name: "Gemini 1.5 Pro",
        modelFamily: "gemini",
        modelId: "google/gemini-1.5-pro",
        parameters: { temperature: 0 },
        capabilities: ["tool_calling", "vision"],
        contextWindowTokens: 1000000,
        createdAt: "2026-08-18T12:00:00.000Z"
      }
    });

    expect(result.run.benchmarkId).toBe("bmk_vision_evaluation_v1");
    expect(result.evaluation.scoreBreakdown["visual-grounding"]).toBeDefined();
    expect(result.evaluation.scoreBreakdown["multimodal-tool-execution"]).toBeDefined();
    expect(result.provenance.observerSignatureHex).toHaveLength(64);
  });

  it("validates representative regression fixture for SMF benchmark family", () => {
    const raw = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "fixtures/benchmarks/smf_representative_run.json"),
        "utf8"
      )
    ) as BenchmarkExecutionOutput;

    const adapted = adapter.adaptToCanonical(raw);
    expect(adapted.run.id).toBe("run_smf_representative_001");
    expect(adapted.run.benchmarkId).toBe("bmk_smf_semantic_evaluation_v1");
    expect(adapted.evaluation.overallScore).toBe(0.915);
    expect(adapted.evaluation.status).toBe(EvaluationStatus.PASSED);
    expect(adapted.provenance.merkleRootHash).toBe(
      "4444444444444444444444444444444444444444444444444444444444444444"
    );
  });

  it("validates representative regression fixture for HACS benchmark family", () => {
    const raw = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "fixtures/benchmarks/hacs_representative_run.json"),
        "utf8"
      )
    ) as BenchmarkExecutionOutput;

    const adapted = adapter.adaptToCanonical(raw);
    expect(adapted.run.id).toBe("run_hacs_representative_001");
    expect(adapted.run.benchmarkId).toBe("bmk_hacs_agent_resilience_v1");
    expect(adapted.evaluation.overallScore).toBe(0.938);
    expect(adapted.provenance.executionReceiptId).toBe("receipt_run_hacs_representative_001");
  });

  it("validates representative regression fixture for Vision benchmark family", () => {
    const raw = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "fixtures/benchmarks/vision_representative_run.json"),
        "utf8"
      )
    ) as BenchmarkExecutionOutput;

    const adapted = adapter.adaptToCanonical(raw);
    expect(adapted.run.id).toBe("run_vision_representative_001");
    expect(adapted.run.benchmarkId).toBe("bmk_vision_multimodal_grounding_v1");
    expect(adapted.evaluation.overallScore).toBe(0.92);
    expect(adapted.provenance.merkleRootHash).toBe(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
  });
});
