import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import {
  S12_FIXTURE_ID,
  S12_FIXTURES,
  verifyS12FixtureSelection
} from "../../packages/benchmark/src/s12-fixture-selection.js";

const fixtureRoot = (version: "0.1.1" | "0.1.2") =>
  path.join(process.cwd(), "fixtures", S12_FIXTURES[version].directory);
const selection = (version: "0.1.1" | "0.1.2") => ({
  fixtureId: S12_FIXTURE_ID,
  fixtureVersion: version,
  fixtureDigest: S12_FIXTURES[version].fixtureDigest
});

describe("S12 versioned fixture selection", () => {
  it("reconstructs both immutable historical and final prospective identities", () => {
    for (const version of ["0.1.1", "0.1.2"] as const) {
      const result = verifyS12FixtureSelection(fixtureRoot(version), selection(version), false);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.identity).toEqual(
          JSON.parse(readFileSync(path.join(fixtureRoot(version), "fixture-identity.json"), "utf8"))
        );
        expect(result.identity.fixtureDigest).toBe(S12_FIXTURES[version].fixtureDigest);
      }
    }
  });

  it("rejects historical execution and every incomplete or unknown selection", () => {
    const root = fixtureRoot("0.1.2");
    expect(verifyS12FixtureSelection(fixtureRoot("0.1.1"), selection("0.1.1"))).toEqual({
      ok: false,
      code: "KNOWN_DEPENDENCY_INTEGRITY_DEFECT"
    });
    expect(
      verifyS12FixtureSelection(root, {
        fixtureId: S12_FIXTURE_ID,
        fixtureDigest: S12_FIXTURES["0.1.2"].fixtureDigest
      })
    ).toEqual({ ok: false, code: "FIXTURE_SELECTION_REQUIRED" });
    expect(
      verifyS12FixtureSelection(root, { ...selection("0.1.2"), fixtureVersion: "9.9.9" as "0.1.2" })
    ).toEqual({ ok: false, code: "UNKNOWN_FIXTURE_VERSION" });
    expect(
      verifyS12FixtureSelection(root, {
        ...selection("0.1.2"),
        fixtureDigest: S12_FIXTURES["0.1.1"].fixtureDigest
      })
    ).toEqual({ ok: false, code: "FIXTURE_IDENTITY_DRIFT" });
    expect(
      verifyS12FixtureSelection(root, {
        ...selection("0.1.2"),
        fixtureId: "unknown" as typeof S12_FIXTURE_ID
      })
    ).toEqual({ ok: false, code: "FIXTURE_IDENTITY_DRIFT" });
  });

  it("recomputes subject and verifier bytes instead of trusting the identity record", async () => {
    for (const [file, content] of [
      ["src/cli.ts", "export const changed = true;\n"],
      ["verifier/spec.json", "{}\n"]
    ] as const) {
      const parent = await mkdtemp(path.join(tmpdir(), "s12-selection-"));
      const target = path.join(parent, "fixture");
      try {
        await cp(fixtureRoot("0.1.2"), target, { recursive: true });
        await writeFile(path.join(target, file), content);
        expect(verifyS12FixtureSelection(target, selection("0.1.2"))).toEqual({
          ok: false,
          code: "FIXTURE_IDENTITY_DRIFT"
        });
      } finally {
        await rm(parent, { recursive: true, force: true });
      }
    }
  });
});
