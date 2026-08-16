import { describe, it, expect } from "vitest";
import type { BehavioralEventSchema } from "../../packages/semantiq/src/event-schema.js";
import {
  BehavioralGraphBuilder,
  DryReplayEngine,
  HumanReadableTraceRenderer
} from "../../packages/semantiq/src/execution-graph.js";
import type { ReplayBundle } from "../../packages/semantiq/src/execution-graph.js";

describe("Behavioral Execution Graph and Deterministic Replay (Prompt 8.6)", () => {
  const events: readonly BehavioralEventSchema[] = [
    {
      eventId: "evt_1",
      schemaVersion: "1.0.0",
      runId: "run_500",
      actorId: "agent_eval",
      sequenceNumber: 1,
      timestamp: "2026-08-01T11:00:00Z",
      monotonicIndex: 1,
      eventType: "ContextReceived",
      primaryVerb: "read",
      resourceRef: "/tmp/input.txt",
      permissionRef: "perm_read",
      parentEventIds: [],
      causalType: "direct",
      evidenceRefs: [{ uri: "file:///tmp/input.txt", algorithm: "sha256", hash: "hash_in" }],
      redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
      payload: {}
    },
    {
      eventId: "evt_2",
      schemaVersion: "1.0.0",
      runId: "run_500",
      actorId: "agent_eval",
      sequenceNumber: 2,
      timestamp: "2026-08-01T11:00:01Z",
      monotonicIndex: 2,
      eventType: "ActionExecuted",
      primaryVerb: "execute",
      resourceRef: "/tmp/out.log",
      parentEventIds: ["evt_1"],
      causalType: "direct",
      evidenceRefs: [{ uri: "file:///tmp/out.log", algorithm: "sha256", hash: "hash_out" }],
      redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
      payload: {}
    }
  ];

  it("builds deterministic execution graph from trace", () => {
    const builder = new BehavioralGraphBuilder();
    const graph1 = builder.buildGraph("run_500", events);
    const graph2 = builder.buildGraph("run_500", events);

    expect(graph1.nodes.length).toBe(5); // 2 events + 2 resources + 1 permission
    expect(graph1.isDeterministic).toBe(true);
    expect(JSON.stringify(graph1)).toBe(JSON.stringify(graph2));
  });

  it("replays bundle deterministically without live external calls", () => {
    const bundle: ReplayBundle = {
      bundleId: "bundle_500",
      traceId: "trace_500",
      runId: "run_500",
      createdAt: "2026-08-01T11:00:00Z",
      events,
      evidenceHashes: {
        "file:///tmp/input.txt": "hash_in",
        "file:///tmp/out.log": "hash_out"
      }
    };

    const engine = new DryReplayEngine();
    const result = engine.replayBundle(bundle);
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.graph.nodes.length).toBe(5);
  });

  it("detects altered evidence checksums during dry replay", () => {
    const bundle: ReplayBundle = {
      bundleId: "bundle_500",
      traceId: "trace_500",
      runId: "run_500",
      createdAt: "2026-08-01T11:00:00Z",
      events,
      evidenceHashes: {
        "file:///tmp/input.txt": "tampered_hash_value",
        "file:///tmp/out.log": "hash_out"
      }
    };

    const engine = new DryReplayEngine();
    const result = engine.replayBundle(bundle);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("EVIDENCE CHECKSUM MISMATCH");
  });

  it("renders human-readable Markdown trace", () => {
    const renderer = new HumanReadableTraceRenderer();
    const markdown = renderer.renderTraceMarkdown("run_500", events);
    expect(markdown).toContain("# Behavioral Execution Trace");
    expect(markdown).toContain("ContextReceived");
    expect(markdown).toContain("ActionExecuted");
  });
});
