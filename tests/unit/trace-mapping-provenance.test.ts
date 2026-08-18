import { describe, expect, it } from "vitest";
import {
  MappingApprovalStatus,
  MappingProfileRegistry,
  MappingSuggester,
  SchemaFingerprint,
  TraceMapperEngine
} from "../../packages/evidence/src/index.js";
import {
  TraceEventSource,
  TraceEventType,
  TraceStatus
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Semantic Trace Mapping + Provenance Architecture", () => {
  const registry = new MappingProfileRegistry();
  const mapper = new TraceMapperEngine(registry);
  const suggester = new MappingSuggester();

  const rawHacsLogs: readonly Record<string, unknown>[] = [
    {
      step_id: "step_001",
      time: "2026-08-18T12:00:00.000Z",
      type: "user_input",
      arguments: { prompt: "Analyze codebase" },
      noisy_vendor_flag: "x-aws-trace-99",
      custom_metric: 42
    },
    {
      step_id: "step_002",
      time: "2026-08-18T12:00:01.000Z",
      type: "tool_invocation",
      arguments: { tool: "fs_list", path: "/src" },
      noisy_vendor_flag: "x-aws-trace-100",
      memory_dump: "0xdeadbeef"
    },
    {
      step_id: "step_003",
      time: "2026-08-18T12:00:01.500Z",
      type: "tool_result",
      arguments: { files: ["index.ts", "client.ts"] }
    },
    {
      step_id: "step_004",
      time: "2026-08-18T12:00:02.000Z",
      type: "assistant_reply",
      arguments: { response: "Found 2 files." }
    }
  ];

  it("calculates deterministic schema fingerprints for event streams", () => {
    const fp1 = SchemaFingerprint.computeFromEventStream(rawHacsLogs);
    const fp2 = SchemaFingerprint.computeFromEventStream(rawHacsLogs);

    expect(fp1).toHaveLength(64);
    expect(fp1).toBe(fp2);
  });

  it("infers mapping suggestions with high confidence from unmapped raw event streams", () => {
    const suggestion = suggester.suggestProfile("unknown-agent-logs", rawHacsLogs);

    expect(suggestion.sourceSchemaName).toBe("unknown-agent-logs");
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0.8);
    expect(suggestion.suggestedFieldMappings.some((f) => f.targetField === "id")).toBe(true);
    expect(suggestion.suggestedFieldMappings.some((f) => f.targetField === "timestamp")).toBe(true);
    expect(suggestion.suggestedEventTypeMappings.some((t) => t.canonicalType === TraceEventType.TOOL_CALL)).toBe(true);
  });

  it("enforces explicit human approval before a draft mapping profile can be used", () => {
    const draft = registry.registerDraft({
      profileId: "custom_draft_profile",
      version: "1.0.0",
      name: "Custom Draft",
      sourceSchemaName: "custom-v1",
      schemaFingerprint: "0".repeat(64),
      fieldMappings: [{ sourceField: "step_id", targetField: "id" }],
      eventTypeMappings: [],
      preserveUnresolvedFields: true
    });

    expect(draft.approvalStatus).toBe(MappingApprovalStatus.DRAFT);

    // Attempting mapping with unapproved profile must throw an error
    expect(() =>
      mapper.mapRawEventsToCanonicalTrace({
        runId: "run_test_01",
        caseId: "case_01",
        rawEvents: rawHacsLogs,
        profileId: "custom_draft_profile",
        profileVersion: "1.0.0"
      })
    ).toThrow(/unapproved profile/);

    // Human Auditor approves the profile
    const approved = registry.approveProfile(
      "custom_draft_profile",
      "1.0.0",
      "auditor@semantiq.org",
      "Verified against test fixtures"
    );

    expect(approved.approvalStatus).toBe(MappingApprovalStatus.APPROVED);
    expect(approved.approvalMetadata?.approvedBy).toBe("auditor@semantiq.org");
    expect(approved.approvalMetadata?.immutableSnapshotHash).toHaveLength(64);

    // Verification of cryptographic profile integrity
    expect(registry.verifyProfileIntegrity(approved)).toBe(true);
  });

  it("maps raw SemantIQ HACS events into canonical TraceEvents with state-chaining and preserves unresolved fields", () => {
    const result = mapper.mapRawEventsToCanonicalTrace({
      runId: "run_hacs_exec_001",
      caseId: "case_hacs_resilience",
      rawEvents: rawHacsLogs,
      profileId: "profile_hacs_trace_mapping",
      profileVersion: "1.0.0"
    });

    expect(result.mappedEventCount).toBe(4);
    expect(result.trace.status).toBe(TraceStatus.COMPLETED);
    expect(result.trace.events.length).toBe(4);

    // Verify canonical types and sources
    expect(result.trace.events[0]?.type).toBe(TraceEventType.PROMPT);
    expect(result.trace.events[0]?.source).toBe(TraceEventSource.SYSTEM);
    expect(result.trace.events[1]?.type).toBe(TraceEventType.TOOL_CALL);
    expect(result.trace.events[1]?.source).toBe(TraceEventSource.AGENT);
    expect(result.trace.events[2]?.type).toBe(TraceEventType.TOOL_RESULT);
    expect(result.trace.events[2]?.source).toBe(TraceEventSource.ENVIRONMENT);
    expect(result.trace.events[3]?.type).toBe(TraceEventType.RESPONSE);
    expect(result.trace.events[3]?.source).toBe(TraceEventSource.AGENT);

    // Verify cryptographic SHA-256 state chain hashes
    for (let i = 0; i < result.trace.events.length; i++) {
      const evt = result.trace.events[i]!;
      expect(evt.sha256Hash).toHaveLength(64);
      expect(evt.sequenceIndex).toBe(i);
    }

    // Invariant: Unknown/noisy fields remain unresolved in payload without fabrication
    expect(result.unresolvedFieldCount).toBeGreaterThan(0);
    const event1Payload = result.trace.events[0]?.payload as { unresolvedFields?: Record<string, unknown> };
    expect(event1Payload.unresolvedFields).toBeDefined();
    expect(event1Payload.unresolvedFields?.["noisy_vendor_flag"]).toBe("x-aws-trace-99");
    expect(event1Payload.unresolvedFields?.["custom_metric"]).toBe(42);
  });
});
