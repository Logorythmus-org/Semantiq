import { describe, expect, it } from "vitest";
import {
  hashCanonical,
  SHARED_CANONICALIZATION_PROFILE
} from "../../packages/sandbox-contracts/src/index.js";

/**
 * RFC #196 Phase 4: synthetic PUBLIC-SUMMARY privacy contract sketch.
 *
 * Test-only. This is intentionally NOT a whole ObservationEvidence digest,
 * an approved disclosure policy, or an authorized production verifier.
 */
const DISCLOSURE_SCOPE = "public-summary" as const;
const PROJECTION_VERSION = "proposal-0" as const;
const DOMAIN = "semantiq.observation.public-summary" as const;
const WITHHELD_FIELDS = [
  "context.environmentVariables",
  "decision.commandArray",
  "decision.workingDirectory",
  "interpretation.rawThoughtLog",
  "result.stdoutSanitized",
  "result.stderrSanitized",
  "consequence.filesModified"
] as const;

interface PrivateFixture {
  publicRunId: string;
  context: { environmentVariables: Record<string, string> };
  decision: { commandArray: string[]; workingDirectory: string };
  interpretation: { rawThoughtLog: string };
  result: {
    exitCode: number;
    timedOut: boolean;
    stdoutSanitized: string;
    stderrSanitized: string;
  };
  consequence: {
    totalMutationsCount: number;
    filesModified: { path: string; diffUnified: string }[];
  };
}

function sample(): PrivateFixture {
  return {
    publicRunId: "synthetic-public-run-01",
    context: { environmentVariables: { PRIVATE_TOKEN: "fixture-sensitive-env" } },
    decision: {
      commandArray: ["runner", "--token=fixture-sensitive-arg"],
      workingDirectory: "/private/fixture-directory"
    },
    interpretation: { rawThoughtLog: "fixture-sensitive-reasoning" },
    result: {
      exitCode: 0,
      timedOut: false,
      stdoutSanitized: "fixture-sensitive-output",
      stderrSanitized: "fixture-sensitive-error"
    },
    consequence: {
      totalMutationsCount: 1,
      filesModified: [
        { path: "/private/fixture-file", diffUnified: "fixture-sensitive-diff" }
      ]
    }
  };
}

function publicSubject(observation: PrivateFixture) {
  // Explicit projection; never spread raw/private input into public evidence.
  return {
    domain: DOMAIN,
    projectionVersion: PROJECTION_VERSION,
    publicRunId: observation.publicRunId,
    result: {
      exitCode: observation.result.exitCode,
      timedOut: observation.result.timedOut
    },
    consequence: {
      totalMutationsCount: observation.consequence.totalMutationsCount
    },
    withheldFields: WITHHELD_FIELDS
  };
}

function sealPublicSummary(observation: PrivateFixture) {
  const subject = publicSubject(observation);
  const digest = hashCanonical(subject, {
    profile: SHARED_CANONICALIZATION_PROFILE
  }).sha256;

  return {
    envelopeVersion: "proposal-0",
    digestProfile: SHARED_CANONICALIZATION_PROFILE,
    disclosureScope: DISCLOSURE_SCOPE,
    projectionVersion: PROJECTION_VERSION,
    subject,
    digest: `sha256:${digest}`
  };
}

type PublicEnvelope = ReturnType<typeof sealPublicSummary>;

function verifyPublicSummary(envelope: PublicEnvelope): boolean {
  if (
    envelope.envelopeVersion !== "proposal-0" ||
    envelope.digestProfile !== SHARED_CANONICALIZATION_PROFILE ||
    envelope.disclosureScope !== DISCLOSURE_SCOPE ||
    envelope.projectionVersion !== PROJECTION_VERSION ||
    envelope.subject.domain !== DOMAIN ||
    envelope.subject.projectionVersion !== PROJECTION_VERSION
  ) {
    throw new TypeError("Unknown or inconsistent summary profile/scope/version");
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(envelope.digest)) {
    throw new TypeError("Malformed summary digest");
  }
  const computed = hashCanonical(envelope.subject, {
    profile: SHARED_CANONICALIZATION_PROFILE
  }).sha256;
  return envelope.digest === `sha256:${computed}`;
}

describe("RFC #196 Phase 4 — isolated public summary disclosure (test-only)", () => {
  it("never includes synthetic private fields in the public summary subject", () => {
    const subjectJson = JSON.stringify(sealPublicSummary(sample()));
    for (const privateValue of [
      "fixture-sensitive-env",
      "fixture-sensitive-arg",
      "fixture-sensitive-reasoning",
      "fixture-sensitive-output",
      "fixture-sensitive-error",
      "fixture-sensitive-diff",
      "/private/fixture"
    ]) {
      expect(subjectJson).not.toContain(privateValue);
    }
    expect(subjectJson).toContain("public-summary");
    expect(subjectJson).toContain("context.environmentVariables");
  });

  it("binds exactly the disclosed operational outcome, not hidden source data", () => {
    const original = sample();
    const changedResult = {
      ...original,
      result: { ...original.result, exitCode: 1 }
    };
    const changedWithheld = {
      ...original,
      context: { environmentVariables: { PRIVATE_TOKEN: "different-private-value" } },
      decision: {
        commandArray: ["runner", "--token=different-private-arg"],
        workingDirectory: "/different-private-path"
      }
    };

    expect(sealPublicSummary(changedResult).digest).not.toBe(
      sealPublicSummary(original).digest
    );
    // Intentional: this is a public-subset seal, NOT full evidence integrity.
    expect(sealPublicSummary(changedWithheld).digest).toBe(
      sealPublicSummary(original).digest
    );
  });

  it("rejects unknown versions and scopes rather than falling back", () => {
    const envelope = sealPublicSummary(sample());
    expect(verifyPublicSummary(envelope)).toBe(true);

    const changedScope = { ...envelope, disclosureScope: "internal" };
    const changedProfile = { ...envelope, digestProfile: "legacy-ts-v0" };
    const changedVersion = { ...envelope, projectionVersion: "proposal-999" };
    const malformed = { ...envelope, digest: "sha256:bad" };

    expect(() => verifyPublicSummary(changedScope as PublicEnvelope)).toThrow(TypeError);
    expect(() => verifyPublicSummary(changedProfile as PublicEnvelope)).toThrow(TypeError);
    expect(() => verifyPublicSummary(changedVersion as PublicEnvelope)).toThrow(TypeError);
    expect(() => verifyPublicSummary(malformed)).toThrow("Malformed summary digest");
  });

  it("detects tampering of included summary fields", () => {
    const envelope = sealPublicSummary(sample());
    const changedSubject = {
      ...envelope.subject,
      consequence: { totalMutationsCount: 7 }
    };
    const changedEnvelope = { ...envelope, subject: changedSubject };

    expect(verifyPublicSummary(changedEnvelope)).toBe(false);
  });

  it("rejects unsupported numeric values without coercing them into JSON", () => {
    const original = sample();
    for (const unsafeValue of [1.5, Number.NaN, -0, Number.POSITIVE_INFINITY]) {
      const mutated = {
        ...original,
        result: { ...original.result, exitCode: unsafeValue }
      };
      expect(() => sealPublicSummary(mutated)).toThrow(TypeError);
    }
  });
});
