import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalizeV1,
  hashCanonical,
  LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE,
  SHARED_CANONICALIZATION_PROFILE
} from "../../packages/sandbox-contracts/src/canonicalization-profiles.js";

const vectors = JSON.parse(
  readFileSync("tests/fixtures/canonical-json/v1/vectors.json", "utf8")
) as {
  supported: Array<{
    id: string;
    input: unknown;
    expectedCanonicalUtf8: string;
    expectedCanonicalUtf8Hex: string;
    expectedSha256: string;
  }>;
  outOfDomain: Array<{ id: string }>;
};
const legacy = JSON.parse(
  readFileSync("tests/fixtures/canonical-json/legacy/typescript-v0.json", "utf8")
) as { input: unknown; expectedCanonicalUtf8: string; expectedSha256: string };
const registry = JSON.parse(
  readFileSync("Docs/evidence/canonicalization-profiles.json", "utf8")
) as { profiles: Array<{ id: string }>; verificationPolicy: Record<string, unknown> };
const inventory = JSON.parse(
  readFileSync("Docs/evidence/canonicalization-hash-surface-inventory.json", "utf8")
) as {
  classificationCounts: Record<string, number>;
  surfaces: Array<{ id: string; classification: string; paths: string[] }>;
};
const results = readFileSync("tools/conformance/canonical-json/results.json", "utf8");

describe("versioned canonicalization profiles", () => {
  it("keeps every V1 supported vector byte- and digest-exact", () => {
    for (const vector of vectors.supported) {
      const result = hashCanonical(vector.input, { profile: SHARED_CANONICALIZATION_PROFILE });
      expect(result.canonicalUtf8, vector.id).toBe(vector.expectedCanonicalUtf8);
      expect(result.canonicalUtf8Hex, vector.id).toBe(vector.expectedCanonicalUtf8Hex);
      expect(result.sha256, vector.id).toBe(vector.expectedSha256);
      expect(result.canonicalization).toEqual({
        profile: "semantiq-canonical-json-v1",
        hashAlgorithm: "sha256"
      });
    }
  });

  it("preserves the legacy TypeScript reproducer", () => {
    const result = hashCanonical(legacy.input, {
      profile: LEGACY_TYPESCRIPT_CANONICALIZATION_PROFILE
    });
    expect(result.canonicalUtf8).toBe(legacy.expectedCanonicalUtf8);
    expect(result.sha256).toBe(legacy.expectedSha256);
  });

  it("makes object insertion order irrelevant under V1", () => {
    expect(canonicalizeV1({ b: 2, a: 1 })).toBe(canonicalizeV1({ a: 1, b: 2 }));
  });

  it("keeps canonically distinct Unicode sequences distinct", () => {
    expect(canonicalizeV1("é")).not.toBe(canonicalizeV1("e\u0301"));
    expect(canonicalizeV1("سلام 🔬")).toBe('"سلام 🔬"');
  });

  it("rejects unsupported numeric values instead of coercing", () => {
    const unsupported = [
      -0,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      9_007_199_254_740_992,
      -9_007_199_254_740_992
    ];
    expect(unsupported).toHaveLength(vectors.outOfDomain.length);
    for (const value of unsupported) expect(() => canonicalizeV1(value)).toThrow(TypeError);
  });

  it("rejects non-JSON values, cycles, and unpaired surrogates", () => {
    const cycle: unknown[] = [];
    cycle.push(cycle);
    expect(() => canonicalizeV1(undefined)).toThrow(TypeError);
    expect(() => canonicalizeV1(1n)).toThrow(TypeError);
    expect(() => canonicalizeV1(cycle)).toThrow(TypeError);
    expect(() => canonicalizeV1("\ud800")).toThrow(TypeError);
  });

  it("requires known explicit profiles and forbids fallback", () => {
    expect(() =>
      hashCanonical({}, { profile: "unknown-profile" as typeof SHARED_CANONICALIZATION_PROFILE })
    ).toThrow("Unknown canonicalization profile");
    expect(registry.verificationPolicy).toMatchObject({
      profileRequired: true,
      unknownProfile: "fail-closed",
      fallback: "forbidden",
      hashMatchProfileInference: "forbidden"
    });
  });

  it("keeps profile IDs unique and normalized results deterministic", () => {
    const ids = registry.profiles.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(results).not.toMatch(/generatedAt|timestamp|[A-Z]:\\|\/home\//i);
    expect(JSON.parse(results).summary.crossLanguageDivergences).toBe(0);
  });

  it("keeps the hash-surface inventory classified and internally consistent", () => {
    const observed = Object.fromEntries(
      Object.keys(inventory.classificationCounts).map((classification) => [
        classification,
        inventory.surfaces.filter((surface) => surface.classification === classification).length
      ])
    );
    expect(observed).toEqual(inventory.classificationCounts);
    expect(new Set(inventory.surfaces.map(({ id }) => id)).size).toBe(inventory.surfaces.length);
    for (const surface of inventory.surfaces) expect(surface.paths.length).toBeGreaterThan(0);
  });
});
