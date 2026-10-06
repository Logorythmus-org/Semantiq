import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";
import { semanticCoreDigest } from "../packages/benchmark/src/semantic-core-openrouter.js";
import {
  assertSemanticCoreCanaryDGate,
  replaySemanticCoreLocalContent,
  semanticCoreLocalWireRequest,
  SEMANTIC_CORE_LOCAL_REQUEST_CONDITION,
  SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL
} from "../packages/benchmark/src/semantic-core-local-response.js";
import {
  prepareSemanticCoreQualification,
  semanticCoreSubjectInput
} from "../packages/benchmark/src/semantic-core-qualification.js";

// No inference: GitHub clearance is read, but no generation transport is imported.
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
if (
  pr.headRefOid !== source.gitCommit ||
  pr.baseRefName !== "main" ||
  pr.isDraft !== true ||
  pr.state !== "OPEN" ||
  !Array.isArray(pr.statusCheckRollup) ||
  pr.statusCheckRollup.length !== 12 ||
  !pr.statusCheckRollup.every(
    (check: { status?: string; conclusion?: string }) =>
      check.status === "COMPLETED" && check.conclusion === "SUCCESS"
  )
)
  throw new Error("EXACT_DRAFT_PR_HEAD_CI_CLEARANCE_REQUIRED");
const canaryPath = "fixtures/semantic-core-qualification-0.1.3/canary-D.json";
git("ls-files", "--error-unmatch", canaryPath);
const canaryBytes = await readFile(canaryPath);
const canary = JSON.parse(canaryBytes.toString("utf8"));
assertSemanticCoreCanaryDGate(canary);
replaySemanticCoreLocalContent(canary.contentEvidence);
if (
  canary.httpStatus !== 200 ||
  canary.returnedModel !== SEMANTIC_CORE_LOCAL_REQUEST_CONDITION.model ||
  canary.returnedProvider !== "Novita" ||
  canary.usage?.cost !== 0 ||
  canary.embeddedProviderError !== false ||
  canary.error !== null ||
  canary.purpose !== "ENGINEERING_CONTENT_TRANSPORT_ONLY" ||
  canary.scientificAuthority !== "NONE" ||
  canary.bmMaturityAuthority !== "NONE" ||
  semanticCoreDigest(canary.condition) !==
    semanticCoreDigest(SEMANTIC_CORE_LOCAL_REQUEST_CONDITION) ||
  semanticCoreDigest(canary.protocol) !==
    semanticCoreDigest(SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL) ||
  canary.wireRequestDigest !== semanticCoreDigest(semanticCoreLocalWireRequest()) ||
  canary.source.gitTree !== git("rev-parse", `${canary.source.gitCommit}^{tree}`)
)
  throw new Error("CANARY_D_PROVENANCE_FAILURE");
git("merge-base", "--is-ancestor", canary.source.gitCommit, source.gitCommit);
const historicalBaseline = "d08b983a059af3d68487230d8ec740e1df890e01";
const historicalPaths = git(
  "ls-tree",
  "-r",
  "--name-only",
  historicalBaseline,
  "--",
  "fixtures/semantic-core-qualification-0.1.0",
  "fixtures/semantic-core-qualification-0.1.1",
  "fixtures/semantic-core-qualification-0.1.2"
)
  .split("\n")
  .filter(Boolean);
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const historicalArtifacts = [];
for (const path of historicalPaths) {
  const before = execFileSync("git", ["show", `${historicalBaseline}:${path}`], {
    maxBuffer: 10485760
  });
  const after = await readFile(path);
  if (!before.equals(after)) throw new Error("HISTORICAL_ARTIFACT_MUTATION");
  historicalArtifacts.push({ path, sha256: sha256(after) });
}
const prepared = await prepareSemanticCoreQualification(
  "fixtures/benchmark-packs/semantic-core-pilot-0.1.0",
  source
);
const cases = prepared.items.map((item, index) => {
  const wire = semanticCoreLocalWireRequest(semanticCoreSubjectInput(item));
  const reference = prepared.frozen.cases[index];
  if (!reference || reference.caseId !== item.caseId) throw new Error("CASE_IDENTITY_FAILURE");
  return {
    caseId: item.caseId,
    caseDigest: reference.digest,
    promptDigest: semanticCoreDigest(wire.messages),
    wireRequestDigest: semanticCoreDigest(wire)
  };
});
const prompts = cases.map(({ caseId, promptDigest }) => ({ caseId, promptDigest }));
const condition = {
  protocol: SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL,
  source,
  benchmark: prepared.frozen.benchmark,
  packIdentity: prepared.frozen.packIdentity,
  packDigest: prepared.frozen.packDigest,
  cases,
  evaluator: prepared.frozen.evaluator,
  evaluatorConfiguration: prepared.frozen.evaluatorConfiguration,
  metrics: prepared.frozen.metrics,
  subject: SEMANTIC_CORE_LOCAL_REQUEST_CONDITION,
  endpointProvenance: {
    observedAt: canary.observedAt,
    source: "CANARY_D_DISCOVERY",
    metadata: canary.metadata
  },
  requestPolicy: Object.fromEntries(
    Object.entries(semanticCoreLocalWireRequest()).filter(([key]) => key !== "messages")
  ),
  prompts,
  promptInventoryDigest: semanticCoreDigest(prompts),
  runOrder: [1, 2, 3].map((run) => ({ run, caseIds: cases.map(({ caseId }) => caseId) })),
  quotaWindowPolicy: {
    minimumAvailableBeforeEachRun: 24,
    completeRunPerWindow: true,
    maximumCollectionHours: 168,
    minimumRequestIntervalMs: 3500,
    freshLiveRouteAndQuotaPreflightRequiredBeforeEachRun: true,
    materiallyChangedCondition: "STOP_NO_SUBSTITUTION"
  },
  retryPolicy: "NONE_NO_REPLACEMENT_ALL_ATTEMPTS_RETAINED",
  rights: prepared.frozen.rights,
  provenance: prepared.frozen.provenance,
  exposure: prepared.frozen.exposure,
  canaryDArtifactSha256: sha256(canaryBytes),
  scientificStatus: "UNVALIDATED_PROXY",
  coreStatus: "NOT_PROMOTED",
  qualificationOutcome: "INSUFFICIENT_EVIDENCE",
  empiricalAttempts: 0
};
const conditionDigest = semanticCoreDigest(condition);
if (git("status", "--porcelain") || git("rev-parse", "HEAD") !== source.gitCommit)
  throw new Error("SOURCE_CHANGED_DURING_FREEZE");
await mkdir(output, { recursive: true });
await writeFile(
  `${output}/condition.json`,
  JSON.stringify({ condition, conditionDigest }, null, 2) + "\n",
  { flag: "wx" }
);
await writeFile(
  `${output}/source-clearance.json`,
  JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      source,
      pr,
      historicalBaseline,
      historicalArtifacts,
      historicalInventoryDigest: semanticCoreDigest(historicalArtifacts),
      canaryD: "PASSED_ENGINEERING_ONLY",
      qualificationOutcome: "INSUFFICIENT_EVIDENCE",
      empiricalAttempts: 0,
      generationRequestsByFreeze: 0
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
console.log(JSON.stringify({ source, conditionDigest, cases: cases.length, empiricalAttempts: 0 }));
