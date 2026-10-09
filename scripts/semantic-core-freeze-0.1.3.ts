import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";
import { semanticCoreDigest } from "../packages/benchmark/src/semantic-core-openrouter.js";
import {
  prepareSemanticCoreLocalCondition,
  validateSemanticCoreLocalClearance,
  LOCAL_SUPERSEDED_CONDITION
} from "../packages/benchmark/src/semantic-core-local-condition.js";

// No inference: only committed bytes and exact-head GitHub clearance are read.
const args = process.argv.slice(2);
const outputArgument = args[1];
if (args.length !== 2 || args[0] !== "--output" || !outputArgument || !isAbsolute(outputArgument))
  throw new Error("EXTERNAL_ABSOLUTE_OUTPUT_REQUIRED");
const output = resolve(outputArgument);
const git = (...parameters: string[]) =>
  execFileSync("git", ["-c", "core.fsmonitor=false", ...parameters], { encoding: "utf8" }).trim();
const root = git("rev-parse", "--show-toplevel");
if (!relative(root, output).startsWith("..")) throw new Error("OUTPUT_MUST_NOT_DIRTY_SOURCE");
if (git("status", "--porcelain")) throw new Error("CLEAN_COMMITTED_SOURCE_REQUIRED");
const source = { gitCommit: git("rev-parse", "HEAD"), gitTree: git("rev-parse", "HEAD^{tree}") };
const pr = JSON.parse(
  execFileSync(
    "gh",
    [
      "pr",
      "view",
      "166",
      "--repo",
      "Logorythmus-org/Semantiq",
      "--json",
      "headRefOid,baseRefName,isDraft,state,statusCheckRollup"
    ],
    { encoding: "utf8" }
  )
);
const repositoryValidation = validateSemanticCoreLocalClearance({ source, pr }, source);
const canaryPath = "fixtures/semantic-core-qualification-0.1.3/canary-D.json";
git("ls-files", "--error-unmatch", canaryPath);
const canary = JSON.parse(await readFile(canaryPath, "utf8"));
if (canary.source.gitTree !== git("rev-parse", `${canary.source.gitCommit}^{tree}`))
  throw new Error("CANARY_D_PROVENANCE_FAILURE");
git("merge-base", "--is-ancestor", canary.source.gitCommit, source.gitCommit);
const historicalBaseline = "d08b983a059af3d68487230d8ec740e1df890e01";
const historicalRoots = [
  "fixtures/semantic-core-qualification-0.1.0",
  "fixtures/semantic-core-qualification-0.1.1",
  "fixtures/semantic-core-qualification-0.1.2"
];
const historicalPaths = git(
  "ls-tree",
  "-r",
  "--name-only",
  historicalBaseline,
  "--",
  ...historicalRoots
)
  .split("\n")
  .filter(Boolean);
if (git("ls-files", "--", ...historicalRoots) !== historicalPaths.join("\n"))
  throw new Error("HISTORICAL_ARTIFACT_INVENTORY_CHANGED");
const historicalArtifacts = [];
for (const path of historicalPaths) {
  const before = execFileSync("git", ["show", `${historicalBaseline}:${path}`], {
    maxBuffer: 10485760
  });
  const after = await readFile(path);
  if (!before.equals(after)) throw new Error("HISTORICAL_ARTIFACT_MUTATION");
  historicalArtifacts.push({ path, sha256: createHash("sha256").update(after).digest("hex") });
}
const { condition } = await prepareSemanticCoreLocalCondition(
  root,
  "fixtures/benchmark-packs/semantic-core-pilot-0.1.0",
  source
);
const conditionDigest = semanticCoreDigest(condition);
if (git("status", "--porcelain") || git("rev-parse", "HEAD") !== source.gitCommit)
  throw new Error("SOURCE_CHANGED_DURING_FREEZE");
await mkdir(output, { recursive: true });
await writeFile(
  `${output}/condition.json`,
  JSON.stringify(
    {
      freezeStatus: "ACTIVE_PROSPECTIVE_EMPIRICAL_CONDITION",
      empiricalAttempts: 0,
      qualificationOutcome: "INSUFFICIENT_EVIDENCE",
      supersedes: LOCAL_SUPERSEDED_CONDITION,
      condition,
      conditionDigest
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
await writeFile(
  `${output}/source-clearance.json`,
  JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      source,
      pr,
      repositoryValidation,
      historicalBaseline,
      historicalArtifacts,
      historicalInventoryDigest: semanticCoreDigest(historicalArtifacts),
      canaryD: "PASSED_ENGINEERING_ONLY",
      qualificationOutcome: "INSUFFICIENT_EVIDENCE",
      empiricalAttempts: 0,
      generationRequestsByFreeze: 0,
      runner: "scripts/semantic-core-qualification-0.1.3.ts",
      supersedes: LOCAL_SUPERSEDED_CONDITION
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
console.log(
  JSON.stringify({
    source,
    conditionDigest,
    cases: condition.cases.length,
    empiricalAttempts: 0,
    freezeStatus: "ACTIVE_PROSPECTIVE_EMPIRICAL_CONDITION"
  })
);
