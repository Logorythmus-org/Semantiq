import { describe, it, expect } from "vitest";
import {
  BenchmarkIntegrityEngine,
  type SandboxBenchmarkDSL,
  type BehavioralTraceEvent,
  computeSha256,
  canonicalJson
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Benchmark Integrity Architecture", () => {
  const engine = new BenchmarkIntegrityEngine();

  const sampleDSL: SandboxBenchmarkDSL = {
    dslVersion: "1.0.0",
    metadata: {
      benchmarkId: "bench-integrity-01",
      scenarioId: "scenario-integrity-01",
      version: "1.0.0",
      title: "Integrity Protection Test Scenario",
      description: "Tests anti-tamper and Merkle trace integrity",
      tags: ["security", "integrity"],
      license: "Apache-2.0",
      author: "SemantIQ Security Team"
    },
    environment: {
      runtimeType: "container",
      baseImage: "python:3.11-slim",
      resources: { cpuCores: 1, memoryMb: 1024, diskGb: 2 },
      networkPolicy: "ISOLATED"
    },
    actors: [
      {
        actorId: "agent-under-eval",
        role: "PRIMARY_AGENT",
        allowedTools: ["read_file"],
        permissionLevel: "SANDBOX_USER"
      }
    ],
    tools: [
      {
        name: "read_file",
        type: "FILE_SYSTEM",
        description: "Read file",
        timeoutMs: 5000
      }
    ],
    assertions: [
      {
        assertionId: "assert-solution",
        type: "FILE_CONTAINS_REGEX",
        params: { path: "/tmp/output.txt", regex: "SUCCESS" },
        weight: 1.0
      }
    ],
    lifecycle: {
      setupCommands: [],
      maxDurationSeconds: 60,
      totalStepBudget: 10,
      retryBudget: 1,
      teardownCommands: []
    }
  };

  const event1: BehavioralTraceEvent = {
    eventId: "evt-1",
    seq: 1,
    stepIndex: 1,
    stage: "CONTEXT",
    timestamp: "2026-08-15T12:00:00Z",
    agentId: "agent-under-eval",
    actionType: "READ_CONTEXT",
    payload: { prompt: "Analyze code" },
    payloadDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000001",
    previousEventHash: "0000000000000000000000000000000000000000000000000000000000000000"
  };

  const event2: BehavioralTraceEvent = {
    eventId: "evt-2",
    seq: 2,
    stepIndex: 2,
    stage: "ACTION",
    timestamp: "2026-08-15T12:00:05Z",
    agentId: "agent-under-eval",
    actionType: "EXECUTE_TOOL",
    payload: { tool: "read_file", path: "src/app.py" },
    payloadDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000002",
    previousEventHash: computeSha256(canonicalJson(event1))
  };

  it("seals benchmark manifest with canonical SHA-256 digest and author signature", () => {
    const seal = engine.sealManifest(sampleDSL);

    expect(seal.scenarioId).toBe("scenario-integrity-01");
    expect(seal.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(seal.assertionsDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(seal.authorSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("verifies valid append-only Merkle trace hash chain and detects broken links", () => {
    const validCheck = engine.verifyTraceChain([event1, event2]);
    expect(validCheck.valid).toBe(true);
    expect(validCheck.violations.length).toBe(0);

    const tamperedEvent2: BehavioralTraceEvent = {
      ...event2,
      previousEventHash: "badf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00d"
    };

    const brokenCheck = engine.verifyTraceChain([event1, tamperedEvent2]);
    expect(brokenCheck.valid).toBe(false);
    expect(brokenCheck.violations.length).toBeGreaterThan(0);
    expect(brokenCheck.violations[0]).toContain("Merkle trace break");
  });

  it("verifies end-to-end execution integrity and flags rubric tampering", () => {
    const seal = engine.sealManifest(sampleDSL);
    const validReport = engine.verifyExecutionIntegrity(
      seal,
      sampleDSL,
      [event1, event2],
      "run-int-001"
    );

    expect(validReport.integrityGrade).toBe("SEALED_VALID");
    expect(validReport.manifestIntact).toBe(true);
    expect(validReport.scoringRubricIntact).toBe(true);
    expect(validReport.traceSequenceIntact).toBe(true);
    expect(validReport.auditSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);

    const mutatedDSL: SandboxBenchmarkDSL = {
      ...sampleDSL,
      assertions: [
        {
          assertionId: "assert-solution",
          type: "FILE_CONTAINS_REGEX",
          params: { path: "/tmp/output.txt", regex: "TAMPERED" },
          weight: 1.0
        }
      ]
    };

    const tamperedReport = engine.verifyExecutionIntegrity(
      seal,
      mutatedDSL,
      [event1, event2],
      "run-int-002"
    );
    expect(tamperedReport.integrityGrade).toBe("TAMPERING_DETECTED");
    expect(tamperedReport.scoringRubricIntact).toBe(false);
  });

  it("formats comprehensive Markdown integrity report", () => {
    const seal = engine.sealManifest(sampleDSL);
    const report = engine.verifyExecutionIntegrity(
      seal,
      sampleDSL,
      [event1, event2],
      "run-int-001"
    );
    const markdown = engine.formatIntegrityReportMarkdown(report);

    expect(markdown).toContain("# SemantIQ Benchmark Integrity Verification Report");
    expect(markdown).toContain("SEALED_VALID");
    expect(markdown).toContain("Benchmark Manifest");
    expect(markdown).toContain("Auditor Cryptographic Signature");
  });
});
