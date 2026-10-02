import { readFileSync } from "node:fs";
import path from "node:path";
import { computeS12FixtureIdentity } from "./s12-openrouter-feasibility.js";

export const S12_FIXTURE_ID = "s12_lh_config_migration_feasibility" as const;
export const S12_FIXTURES = {
  "0.1.1": {
    directory: "s12-lh-config-migration-feasibility",
    fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63",
    startingTreeDigest: "d53a14ebfb99abd9592f24b7d18418ef450a714f5469e8dfba7bf17e7db043fb",
    verifierDigest: "4c421830e18947701bacc01c921addb62c62077a455698193e4af074200fc298",
    executable: false
  },
  "0.1.2": {
    directory: "s12-lh-config-migration-feasibility-0.1.2",
    fixtureDigest: "05041288fc913ad00e66162b62665159fe6831f74f5c1e7b4bd14d269b7344c5",
    startingTreeDigest: "e68e7db0ec98100505e8efed25e507439b78effd17c12eb86ce6facb0d2304c9",
    verifierDigest: "ef2a7cea458bdc30d8fab95b4427eabef63f151b6902f12a2af82ffdd4e085ca",
    executable: true
  }
} as const;

export type S12FixtureVersion = keyof typeof S12_FIXTURES;
export type S12FixtureSelection = {
  readonly fixtureId: typeof S12_FIXTURE_ID;
  readonly fixtureVersion: S12FixtureVersion;
  readonly fixtureDigest: string;
};

const SUBJECT_VISIBLE = [
  "README.md",
  "TASK.md",
  "examples/expected-v2.json",
  "examples/invalid-v1.json",
  "examples/valid-v1.json",
  "fixture-manifest.json",
  "package.json",
  "pnpm-lock.yaml",
  "src/cli.ts",
  "src/migrate.ts",
  "src/schema-v1.ts",
  "src/schema-v2.ts",
  "tsconfig.json"
] as const;

export type S12FixtureVerification =
  | {
      readonly ok: true;
      readonly identity: ReturnType<typeof computeS12FixtureIdentity>;
      readonly executable: boolean;
    }
  | {
      readonly ok: false;
      readonly code:
        | "FIXTURE_SELECTION_REQUIRED"
        | "FIXTURE_IDENTITY_DRIFT"
        | "UNKNOWN_FIXTURE_VERSION"
        | "KNOWN_DEPENDENCY_INTEGRITY_DEFECT";
    };

export function verifyS12FixtureSelection(
  workspaceRoot: string,
  selection: {
    readonly fixtureId?: typeof S12_FIXTURE_ID | undefined;
    readonly fixtureVersion?: S12FixtureVersion | undefined;
    readonly fixtureDigest?: string | undefined;
  },
  prospectiveExecution = true
): S12FixtureVerification {
  if (!selection.fixtureId || !selection.fixtureVersion || !selection.fixtureDigest)
    return { ok: false, code: "FIXTURE_SELECTION_REQUIRED" };
  if (selection.fixtureId !== S12_FIXTURE_ID) return { ok: false, code: "FIXTURE_IDENTITY_DRIFT" };
  if (!Object.prototype.hasOwnProperty.call(S12_FIXTURES, selection.fixtureVersion))
    return { ok: false, code: "UNKNOWN_FIXTURE_VERSION" };
  const expected = S12_FIXTURES[selection.fixtureVersion];
  if (selection.fixtureDigest !== expected.fixtureDigest)
    return { ok: false, code: "FIXTURE_IDENTITY_DRIFT" };
  try {
    const read = (name: string) => readFileSync(path.join(workspaceRoot, name), "utf8");
    const identity = computeS12FixtureIdentity({
      scenarioId: S12_FIXTURE_ID,
      scenarioVersion: selection.fixtureVersion,
      canonicalManifest: JSON.parse(read("fixture-manifest.json")),
      startingTree: Object.fromEntries(SUBJECT_VISIBLE.map((name) => [name, read(name)])),
      taskInstruction: read("TASK.md"),
      verifierMaterial: {
        spec: JSON.parse(read("verifier/spec.json")),
        test: read("verifier/final-state.test.mjs")
      }
    });
    const record = JSON.parse(read("fixture-identity.json")) as ReturnType<
      typeof computeS12FixtureIdentity
    >;
    if (
      identity.scenarioVersion !== selection.fixtureVersion ||
      identity.fixtureDigest !== expected.fixtureDigest ||
      identity.startingTreeDigest !== expected.startingTreeDigest ||
      identity.verifierDigest !== expected.verifierDigest ||
      Object.keys(identity).some(
        (key) => record[key as keyof typeof identity] !== identity[key as keyof typeof identity]
      )
    )
      return { ok: false, code: "FIXTURE_IDENTITY_DRIFT" };
    if (prospectiveExecution && !expected.executable)
      return { ok: false, code: "KNOWN_DEPENDENCY_INTEGRITY_DEFECT" };
    return { ok: true, identity, executable: expected.executable };
  } catch {
    return { ok: false, code: "FIXTURE_IDENTITY_DRIFT" };
  }
}
