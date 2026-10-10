import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  hashCanonical,
  SHARED_CANONICALIZATION_PROFILE
} from "../../packages/sandbox-contracts/src/index.js";

/**
 * Bounded characterization for #192.
 *
 * The legacy normalizer's top-level-key JSON.stringify replacer
 * is exercised without changing production hashing semantics.
 * A future fix requires caller analysis and compatibility review.
 */
describe("evidence normalization digest preimage characterization (#192)", () => {
  const sample = (exitCode: number, environmentValue: string) => ({
    evidenceId: "fixed-fixture",
    normalizedAt: "2026-10-10T00:00:00.000Z",
    context: {
      environmentVariables: { TEST_VALUE: environmentValue }
    },
    result: {
      exitCode,
      timedOut: false
    },
    consequence: {
      filesCreated: [{ path: "out.txt", sha256: "sample" }]
    }
  });

  it("demonstrates that the legacy array replacer omits nested evidence changes", () => {
    const success = sample(0, "first");
    const failure = sample(1, "second");
    const legacyPreimage = (value: typeof success) =>
      JSON.stringify(value, Object.keys(value).sort());

    expect(legacyPreimage(success)).toBe(legacyPreimage(failure));
    expect(legacyPreimage(success)).toContain('"result":{}');
    expect(legacyPreimage(success)).toContain('"context":{}');

    // Only a characterization, not a production normalizer repair.
    expect(canonicalJson(success)).not.toBe(canonicalJson(failure));
  });

  it("demonstrates that the shared canonical profile retains nested fields", () => {
    const success = sample(0, "first");
    const failure = sample(1, "second");

    const a = hashCanonical(success, { profile: SHARED_CANONICALIZATION_PROFILE });
    const b = hashCanonical(failure, { profile: SHARED_CANONICALIZATION_PROFILE });

    expect(a.canonicalization.profile).toBe("semantiq-canonical-json-v1");
    expect(a.canonicalUtf8).toContain('"exitCode":0');
    expect(b.canonicalUtf8).toContain('"exitCode":1');
    expect(a.sha256).not.toBe(b.sha256);
  });

  it("normalizes nested key order for otherwise equivalent objects", () => {
    const left = {
      result: { exitCode: 0, timedOut: false },
      context: { environmentVariables: { A: "a", B: "b" } }
    };
    const right = {
      context: { environmentVariables: { B: "b", A: "a" } },
      result: { timedOut: false, exitCode: 0 }
    };

    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(
      hashCanonical(left, { profile: SHARED_CANONICALIZATION_PROFILE }).sha256
    ).toBe(
      hashCanonical(right, { profile: SHARED_CANONICALIZATION_PROFILE }).sha256
    );
  });
});
