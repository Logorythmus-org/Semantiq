import { describe, expect, it } from "vitest";
import {
  computeSha256,
  hashCanonical,
  SHARED_CANONICALIZATION_PROFILE
} from "../../packages/sandbox-contracts/src/index.js";

/**
 * RFC #196: isolated, TEST-ONLY migration feasibility sketch.
 *
 * Deliberately NOT exported by any runtime package. The real ObservationEvidence
 * contract, field allowlist, redaction scope, and public profile envelope are
 * unresolved and must be approved before production integration.
 *
 * Critically, the historical top-level-replacer is NOT the existing
 * legacy-ts-v0 canonicalization profile (which recursively sorts keys).
 */
const LEGACY_OBSERVATION_PROFILE = "observation-top-level-replacer-v0" as const;
const NEW_OBSERVATION_PROFILE = SHARED_CANONICALIZATION_PROFILE;

interface SyntheticObservation {
  evidenceId: string;
  normalizedAt: string;
  context: { environmentVariables: Record<string, string> };
  result: { exitCode: number; timedOut: boolean };
  consequence: { filesCreated: { path: string; sha256: string }[] };
  interpretation?: { rawThoughtLog: string } | undefined;
  evidenceDigest?: string | undefined;
}

const sample = (): SyntheticObservation => ({
  evidenceId: "e1",
  normalizedAt: "2026-10-10T00:00:00.000Z",
  context: { environmentVariables: { TEST_MODE: "dry-run" } },
  result: { exitCode: 0, timedOut: false },
  consequence: { filesCreated: [] },
  interpretation: undefined
});

function legacyDigest(subject: SyntheticObservation): string {
  const { evidenceDigest: _digest, ...payload } = subject;
  const preimage = JSON.stringify(payload, Object.keys(payload).sort());
  return `sha256:${computeSha256(preimage)}`;
}

/**
 * A *candidate* projection for synthetic fixtures only. In particular:
 * optional interpretation is explicitly omitted, but unsupported nested values
 * still fail closed in the shared V1 canonicalizer (no JSON round-trip coercion).
 */
function v1Subject(subject: SyntheticObservation): Record<string, unknown> {
  const { evidenceDigest: _digest, interpretation, ...payload } = subject;
  if (interpretation === undefined) return payload;
  return { ...payload, interpretation };
}

function v1Digest(subject: SyntheticObservation): string {
  return `sha256:${
    hashCanonical(v1Subject(subject), { profile: NEW_OBSERVATION_PROFILE }).sha256
  }`;
}

function verifyExplicit(
  subject: SyntheticObservation,
  tagged: { profile?: string; digest: string }
): boolean {
  if (!/^sha256:[a-f0-9]{64}$/.test(tagged.digest)) {
    throw new TypeError("Invalid digest format");
  }
  if (tagged.profile === LEGACY_OBSERVATION_PROFILE) {
    return legacyDigest(subject) === tagged.digest;
  }
  if (tagged.profile === NEW_OBSERVATION_PROFILE) {
    return v1Digest(subject) === tagged.digest;
  }
  throw new TypeError("Missing or unknown observation digest profile");
}

describe("RFC #196 — proposed ObservationEvidence digest profiles (test-only)", () => {
  it("pins the exact legacy byte behavior without rehashing historical artifacts", () => {
    const value = sample();
    const serialized = JSON.stringify(value, Object.keys(value).sort());

    expect(serialized).toBe(
      '{"consequence":{},"context":{},"evidenceId":"e1","normalizedAt":' +
        '"2026-10-10T00:00:00.000Z","result":{}}'
    );
    expect(legacyDigest(value)).toBe(
      "sha256:2968f732f7053b529ccc0d6bdf5d57e2af2a8361303653f5beae3b8ec4983e76"
    );
  });

  it("separates legacy identity from V1 when nested observation fields change", () => {
    const initial = sample();
    const changedResult = { ...initial, result: { exitCode: 9, timedOut: false } };
    const changedContext = {
      ...initial,
      context: { environmentVariables: { TEST_MODE: "replayed" } }
    };
    const changedFiles = {
      ...initial,
      consequence: { filesCreated: [{ path: "report.txt", sha256: "synthetic" }] }
    };

    for (const modified of [changedResult, changedContext, changedFiles]) {
      expect(legacyDigest(modified)).toBe(legacyDigest(initial));
      expect(v1Digest(modified)).not.toBe(v1Digest(initial));
    }
  });

  it("keeps digest out of its own subject and explicitly omits one optional member", () => {
    const value = sample();
    const digest = v1Digest(value);

    expect(v1Digest({ ...value, evidenceDigest: digest })).toBe(digest);
    expect(v1Digest({ ...value, interpretation: { rawThoughtLog: "synthetic" } })).not.toBe(
      digest
    );
  });

  it("is invariant to nested object key order while retaining array ordering", () => {
    const left = sample();
    const right = {
      ...left,
      context: { environmentVariables: { Z: "last", A: "first" } }
    };
    const reordered = {
      ...left,
      context: { environmentVariables: { A: "first", Z: "last" } }
    };

    expect(v1Digest(right)).toBe(v1Digest(reordered));
    expect(
      v1Digest({
        ...left,
        consequence: {
          filesCreated: [
            { path: "a", sha256: "one" },
            { path: "b", sha256: "two" }
          ]
        }
      })
    ).not.toBe(
      v1Digest({
        ...left,
        consequence: {
          filesCreated: [
            { path: "b", sha256: "two" },
            { path: "a", sha256: "one" }
          ]
        }
      })
    );
  });

  it("fails closed on unversioned/unknown profiles and malformed digests", () => {
    const subject = sample();
    const digest = v1Digest(subject);

    expect(verifyExplicit(subject, { profile: NEW_OBSERVATION_PROFILE, digest })).toBe(true);
    expect(verifyExplicit(subject, { profile: LEGACY_OBSERVATION_PROFILE, digest })).toBe(
      false
    );
    expect(() => verifyExplicit(subject, { digest })).toThrow("Missing or unknown");
    expect(() => verifyExplicit(subject, { profile: "legacy-ts-v0", digest })).toThrow(
      "Missing or unknown"
    );
    expect(() =>
      verifyExplicit(subject, { profile: NEW_OBSERVATION_PROFILE, digest: "sha256:invalid" })
    ).toThrow("Invalid digest format");
  });

  it("rejects unsupported nested values rather than silently coercing them", () => {
    const value = sample();
    const withNonInteger = {
      ...value,
      result: { ...value.result, exitCode: 1.5 }
    };
    const withUndefinedArray = {
      ...value,
      consequence: {
        filesCreated: [undefined]
      }
    } as unknown as SyntheticObservation;
    const withNestedUndefined = {
      ...value,
      result: { ...value.result, unrecognizedOptional: undefined }
    };

    expect(() => v1Digest(withNonInteger)).toThrow(TypeError);
    expect(() => v1Digest(withUndefinedArray)).toThrow(TypeError);
    expect(() => v1Digest(withNestedUndefined)).toThrow(TypeError);
  });
});
