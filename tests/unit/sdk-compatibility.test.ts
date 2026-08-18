import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SemantiqClient,
  type SystemProfile,
  type Benchmark,
  type Case,
  type Run,
  type Trace,
  ProductRunStatus,
  TraceStatus,
  EvaluationStatus,
  ClaimStatus,
  ReviewVerdict,
  SDK_VERSION
} from "../../packages/sdk/src/index.js";

describe("SemantIQ Dual-Language SDK Parity & Shared Fixture Compatibility", () => {
  const fixturePath = resolve(process.cwd(), "fixtures/contracts/canonical_entities.json");
  const rawFixtures = JSON.parse(readFileSync(fixturePath, "utf8"));

  it("exports matching SDK version", () => {
    expect(SDK_VERSION).toBe("0.1.0-alpha.2");
  });

  it("validates shared SystemProfile fixture in TypeScript SDK", () => {
    const raw = rawFixtures.systemProfile;
    const profile: SystemProfile = {
      id: raw.id,
      version: raw.version,
      name: raw.name,
      modelFamily: raw.modelFamily,
      modelId: raw.modelId,
      parameters: raw.parameters,
      capabilities: raw.capabilities,
      contextWindowTokens: raw.contextWindowTokens,
      createdAt: raw.createdAt,
      metadata: raw.metadata
    };

    expect(profile.id).toMatch(/^sys_prof_/);
    expect(profile.modelFamily).toBe("gpt");
    expect(profile.contextWindowTokens).toBe(128000);
  });

  it("validates shared Benchmark and Case fixtures", () => {
    const rawBmk = rawFixtures.benchmark;
    const benchmark: Benchmark = {
      id: rawBmk.id,
      version: rawBmk.version,
      name: rawBmk.name,
      description: rawBmk.description,
      domain: rawBmk.domain,
      categories: rawBmk.categories,
      caseIds: rawBmk.caseIds,
      rubricIds: rawBmk.rubricIds,
      versionTag: rawBmk.versionTag,
      createdAt: rawBmk.createdAt,
      metadata: rawBmk.metadata
    };

    const rawCase = rawFixtures.case;
    const scenarioCase: Case = {
      id: rawCase.id,
      version: rawCase.version,
      benchmarkId: rawCase.benchmarkId,
      title: rawCase.title,
      prompt: rawCase.prompt,
      inputs: rawCase.inputs,
      expectedBehavior: rawCase.expectedBehavior,
      tags: rawCase.tags,
      constraints: rawCase.constraints
    };

    expect(benchmark.id).toMatch(/^bmk_/);
    expect(benchmark.caseIds).toContain(scenarioCase.id);
    expect(scenarioCase.inputs.attackVector).toBe("direct_override");
  });

  it("validates shared Run and Trace fixtures", () => {
    const rawRun = rawFixtures.run;
    const run: Run = {
      id: rawRun.id,
      version: rawRun.version,
      benchmarkId: rawRun.benchmarkId,
      systemProfileId: rawRun.systemProfileId,
      status: rawRun.status as ProductRunStatus,
      startedAt: rawRun.startedAt,
      completedAt: rawRun.completedAt,
      traceIds: rawRun.traceIds,
      evaluationId: rawRun.evaluationId,
      executionReceiptId: rawRun.executionReceiptId,
      environmentMetadata: rawRun.environmentMetadata
    };

    const rawTrace = rawFixtures.trace;
    const trace: Trace = {
      id: rawTrace.id,
      version: rawTrace.version,
      runId: rawTrace.runId,
      caseId: rawTrace.caseId,
      status: rawTrace.status as TraceStatus,
      events: rawTrace.events,
      tokenUsage: rawTrace.tokenUsage,
      durationMs: rawTrace.durationMs,
      startedAt: rawTrace.startedAt,
      endedAt: rawTrace.endedAt
    };

    expect(run.status).toBe(ProductRunStatus.COMPLETED);
    expect(run.environmentMetadata.isOfflineDeterministic).toBe(true);
    expect(trace.status).toBe(TraceStatus.COMPLETED);
    expect(trace.events.length).toBe(2);
  });

  it("executes TypeScript SemantiqClient offline deterministic evaluation", async () => {
    const client = new SemantiqClient({ isOfflineDeterministic: true });
    expect(client.isOfflineMode()).toBe(true);

    const result = await client.evaluate({
      systemProfile: rawFixtures.systemProfile,
      benchmark: rawFixtures.benchmark,
      scenarioCase: rawFixtures.case
    });

    expect(result.run.status).toBe(ProductRunStatus.COMPLETED);
    expect(result.evaluation.status).toBe(EvaluationStatus.PASSED);
    expect(result.evaluation.overallScore).toBe(1.0);
    expect(result.claims.length).toBe(1);
    expect(result.claims[0]?.status).toBe(ClaimStatus.VERIFIED);
    expect(result.review.verdict).toBe(ReviewVerdict.APPROVED);
  });

  it("verifies receipt hash in TypeScript SemantiqClient", () => {
    const client = new SemantiqClient();
    const verified = client.verifyReceipt(rawFixtures.researchBundle);
    expect(verified).toBe(true);
  });
});
