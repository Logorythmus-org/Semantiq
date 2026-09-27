import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  compareS12TrackARepeatability,
  runS12TrackAQualification,
  S12_TRACK_A_FIXTURE,
  verifyS12TrackAStartingFixture
} from "../../packages/benchmark/src/s12-track-a-qualification.js";

const fixture = path.resolve("fixtures/s12-pipeline-qualification-edit");
const temporary: string[] = [];

async function copyFixture(): Promise<string> {
  const target = await mkdtemp(path.join(os.tmpdir(), "track-a-"));
  temporary.push(target);
  await cp(fixture, target, { recursive: true });
  return target;
}

afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((target) => rm(target, { recursive: true, force: true }))
  );
});

describe("S12 Track-A governed reconstruction", () => {
  it("does not establish repeatability from one digest and compares two independent positive executions", async () => {
    const firstRoot = await copyFixture();
    const secondRoot = await copyFixture();
    const [first, second] = await Promise.all([
      runS12TrackAQualification({ workspaceRoot: firstRoot }),
      runS12TrackAQualification({ workspaceRoot: secondRoot })
    ]);
    expect(first.outcome).toBe("QUALIFIED");
    expect(second.outcome).toBe("QUALIFIED");
    expect(first.qualification?.modelRequestCount).toBe(2);
    expect(second.qualification?.modelRequestCount).toBe(2);
    expect(first.verification?.testExitCode).toBe(0);
    expect(second.verification?.testExitCode).toBe(0);
    expect(first.captureDigest).toBeTruthy();
    expect(first.captureDigest).toBeDefined();
    expect(first.s05Projection?.comparedProjectionDigests).toHaveLength(1);
    expect(first.s05Projection?.exactMatch).toBe(false);
    const comparison = compareS12TrackARepeatability(first, second);
    expect(first.capture?.runId).not.toBe(second.capture?.runId);
    expect(first.capture?.attemptId).not.toBe(second.capture?.attemptId);
    expect(comparison.comparedProjectionDigests).toEqual([
      first.repeatabilityProjection?.digest,
      second.repeatabilityProjection?.digest
    ]);
    expect(comparison.comparedProjectionDigests[0]).toBe(comparison.comparedProjectionDigests[1]);
    expect(comparison.exactMatch).toBe(true);
    expect(comparison.canonicalSemanticDigest).toBeTruthy();
    expect(first.outcome).toBe("QUALIFIED");
    expect(second.outcome).toBe("QUALIFIED");
    expect(first.s09?.captureReference).toBe(`capture:${first.captureDigest}`);
    expect(first.s09?.authority).toBe("INTERNAL_CONSISTENCY_ONLY");
    expect(first.s09?.scientificAuthority).toBe("NONE");
    expect(await readFile(path.join(firstRoot, "src/message.mjs"), "utf8")).toContain('"beta"');
  });

  it("does not report exact match for independent nonmatching projections", async () => {
    const positiveRoot = await copyFixture();
    const wrongRoot = await copyFixture();
    const positive = await runS12TrackAQualification({ workspaceRoot: positiveRoot });
    const wrong = await runS12TrackAQualification({
      workspaceRoot: wrongRoot,
      witness: "WRITE_WRONG_VALUE"
    });
    const comparison = compareS12TrackARepeatability(positive, wrong);
    expect(wrong.outcome).toBe("NOT_QUALIFIED");
    expect(comparison.comparedProjectionDigests).toEqual([
      positive.repeatabilityProjection?.digest,
      wrong.repeatabilityProjection?.digest
    ]);
    expect(comparison.comparedProjectionDigests[0]).not.toBe(
      comparison.comparedProjectionDigests[1]
    );
    expect(comparison.exactMatch).toBe(false);
    expect(positive.outcome).toBe("QUALIFIED");
  });

  it("rejects duplicate or fabricated execution evidence as the second observation", async () => {
    const root = await copyFixture();
    const result = await runS12TrackAQualification({ workspaceRoot: root });
    expect(() => compareS12TrackARepeatability(result, result)).toThrow(
      "TRACK_A_REPEATABILITY_REQUIRES_DISTINCT_EXECUTIONS"
    );
    expect(() =>
      compareS12TrackARepeatability(result, {
        ...result,
        capture: structuredClone(result.capture),
        repeatabilityProjection: structuredClone(result.repeatabilityProjection)
      })
    ).toThrow("TRACK_A_REPEATABILITY_UNPROVEN_EXECUTION");
  });

  it.each(["NO_EDIT", "WRITE_WRONG_VALUE", "FALSE_COMPLETION_CLAIM", "MISLEADING_TRACE"] as const)(
    "does not qualify witness %s",
    async (
      witness: "NO_EDIT" | "WRITE_WRONG_VALUE" | "FALSE_COMPLETION_CLAIM" | "MISLEADING_TRACE"
    ) => {
      const root = await copyFixture();
      const result = await runS12TrackAQualification({ workspaceRoot: root, witness });
      expect(result.outcome).toBe("NOT_QUALIFIED");
      expect(result.verification?.outcome).toBe("NOT_QUALIFIED");
    }
  );

  it("keeps misleading diagnostics outside the capture, S05, and S09 evidence", async () => {
    const cleanRoot = await copyFixture();
    const noisyRoot = await copyFixture();
    const clean = await runS12TrackAQualification({ workspaceRoot: cleanRoot });
    const noisy = await runS12TrackAQualification({
      workspaceRoot: noisyRoot,
      diagnosticText: "QUALIFIED"
    });
    expect(noisy.outcome).toBe(clean.outcome);
    expect(
      noisy.capture?.toolCalls.map(({ name, arguments: args, result, exitStatus, provenance }) => ({
        name,
        arguments: args,
        result,
        exitStatus,
        provenance
      }))
    ).toEqual(
      clean.capture?.toolCalls.map(({ name, arguments: args, result, exitStatus, provenance }) => ({
        name,
        arguments: args,
        result,
        exitStatus,
        provenance
      }))
    );
    expect(noisy.repeatabilityProjection).toEqual(clean.repeatabilityProjection);
    expect(noisy.s05Projection).toEqual(clean.s05Projection);
    const diagnosticComparison = compareS12TrackARepeatability(clean, noisy);
    expect(diagnosticComparison.exactMatch).toBe(true);
    expect(diagnosticComparison.comparedProjectionDigests).toEqual([
      clean.repeatabilityProjection?.digest,
      noisy.repeatabilityProjection?.digest
    ]);
    expect(noisy.s09?.captureReference).toBe(`capture:${noisy.s09?.captureDigest}`);
    expect(clean.s09?.captureReference).toBe(`capture:${clean.s09?.captureDigest}`);
    expect(JSON.stringify(noisy.s09)).not.toContain("QUALIFIED");
    expect(JSON.stringify(diagnosticComparison)).not.toContain("QUALIFIED");
    expect(noisy.diagnosticSidecar?.authority).toBe("NON_AUTHORITATIVE_OBSERVABILITY");
  });

  it("binds actual starting bytes, ignores caller claims, and independently protects verifier material", async () => {
    const root = await copyFixture();
    const valid = await verifyS12TrackAStartingFixture(root, "stale-caller-digest");
    expect(valid.outcome).toBe("QUALIFIED");
    expect(valid.actualStartingIdentity).toBe(S12_TRACK_A_FIXTURE.startingIdentity);

    await writeFile(
      path.join(root, "src/message.mjs"),
      'export function getMessage() { return "wrong"; }\n'
    );
    const wrongWithExpectedCallerClaim = await verifyS12TrackAStartingFixture(
      root,
      S12_TRACK_A_FIXTURE.startingIdentity
    );
    expect(wrongWithExpectedCallerClaim.outcome).toBe("NOT_QUALIFIED");

    const protectedRoot = await copyFixture();
    await writeFile(path.join(protectedRoot, "verification-contract.json"), "{}\n");
    expect((await verifyS12TrackAStartingFixture(protectedRoot)).outcome).toBe("NOT_QUALIFIED");
  });

  it("reports a missing required source artifact as MISSING", async () => {
    const root = await copyFixture();
    await rm(path.join(root, "src/message.mjs"));
    expect((await verifyS12TrackAStartingFixture(root)).outcome).toBe("MISSING");
    expect((await runS12TrackAQualification({ workspaceRoot: root })).outcome).toBe("MISSING");
  });
});
