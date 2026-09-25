import { describe, expect, it } from "vitest";
import {
  CONFIG_DIGEST,
  S12_CONFIG_DIGEST_10T,
  S12_CONFIG_DIGEST_20T,
  S12_EXECUTION_STRATA,
  S12_SUBJECT,
  S12_SUBJECT_CONFIGURATION,
  readS12ExecutionConfiguration,
  s12ProspectiveConfigDigest,
  validateS12ExecutionContract
} from "../../packages/benchmark/src/s12-openrouter-feasibility.js";

describe("S12 explicit execution contract", () => {
  it("preserves legacy configuration semantics without upgrading observations", () => {
    const historical = { subject: S12_SUBJECT, configuration: S12_SUBJECT_CONFIGURATION };
    const read = readS12ExecutionConfiguration(JSON.parse(JSON.stringify(historical)));
    expect(read.kind).toBe("LEGACY");
    expect(S12_SUBJECT.maxAttempts).toBe(10);
    expect(S12_SUBJECT_CONFIGURATION.retryPolicy.value.maximumAttempts).toBe(10);
    expect(CONFIG_DIGEST).toHaveLength(64);
    expect(JSON.stringify(read)).not.toContain("maxSubjectAttempts");
  });

  it("serializes both prospective strata with separate authoritative limits", () => {
    for (const [id, turns] of [
      ["S12_10_TURNS", 10],
      ["S12_20_TURNS", 20]
    ] as const) {
      const serialized = JSON.stringify(S12_EXECUTION_STRATA[id]);
      const read = readS12ExecutionConfiguration(JSON.parse(serialized));
      expect(read.kind).toBe("EXPLICIT");
      if (read.kind === "EXPLICIT") {
        expect(read.value.maxSubjectAttempts).toBe(1);
        expect(read.value.maxModelTurns).toBe(turns);
        expect(read.value.automaticSubjectRetries).toBe(0);
        expect(read.value.maxAttemptWallTimeMs).toBe(30 * 60 * 1000);
        expect(read.value.routing).toBe("FREE_ONLY");
      }
    }
  });

  it("fails closed on missing fields and ignores legacy compatibility metadata", () => {
    const base = S12_EXECUTION_STRATA.S12_20_TURNS;
    expect(() => validateS12ExecutionContract({ ...base, maxModelTurns: undefined })).toThrow();
    expect(() =>
      validateS12ExecutionContract({ ...base, maxSubjectAttempts: undefined })
    ).toThrow();
    expect(() => readS12ExecutionConfiguration({ contract: base.contract })).toThrow();
    const withLegacy = { ...base, maxAttempts: 3, retryPolicy: { maximumAttempts: 2 } };
    expect(validateS12ExecutionContract(withLegacy).maxModelTurns).toBe(20);
    expect(s12ProspectiveConfigDigest(withLegacy)).toBe(S12_CONFIG_DIGEST_20T);
  });

  it("binds turns, attempts, wall time and free routing deterministically", () => {
    expect(s12ProspectiveConfigDigest(S12_EXECUTION_STRATA.S12_10_TURNS)).toBe(
      S12_CONFIG_DIGEST_10T
    );
    expect(s12ProspectiveConfigDigest(S12_EXECUTION_STRATA.S12_20_TURNS)).toBe(
      S12_CONFIG_DIGEST_20T
    );
    expect(S12_CONFIG_DIGEST_10T).not.toBe(S12_CONFIG_DIGEST_20T);
    for (const change of [
      { maxSubjectAttempts: 2 },
      { maxAttemptWallTimeMs: 60_000 },
      { routing: "PAID" }
    ]) {
      expect(() =>
        validateS12ExecutionContract({ ...S12_EXECUTION_STRATA.S12_10_TURNS, ...change })
      ).toThrow();
    }
  });
});
