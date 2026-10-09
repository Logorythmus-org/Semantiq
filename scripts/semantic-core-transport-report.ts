import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { SEMANTIC_CORE_TRANSPORT_PROTOCOL } from "../packages/benchmark/src/semantic-core-transport-diagnostic.js";

const directory = "fixtures/semantic-core-qualification-0.1.2";
const historicalHead = "6263f95475def9eafec9c89c2cec544fbb12fd0e";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const paths = execFileSync(
  "git",
  [
    "ls-tree",
    "-r",
    "--name-only",
    historicalHead,
    "--",
    "fixtures/semantic-core-qualification-0.1.1"
  ],
  { encoding: "utf8" }
)
  .trim()
  .split(/\r?\n/);
const historicalArtifacts = [];
for (const path of paths) {
  const bytes = await readFile(path);
  const original = execFileSync("git", ["show", `${historicalHead}:${path}`], {
    maxBuffer: 10 * 1024 * 1024
  });
  if (!bytes.equals(original)) throw new Error("HISTORICAL_BYTES_CHANGED");
  historicalArtifacts.push({
    path,
    bytes: bytes.length,
    sha256: hash(bytes),
    historicalBytesMatch: true
  });
}
const names = [
  "transport-canary-A.json",
  "transport-canary-B.json",
  "transport-canary-B-inspection.json"
];
const artifacts = [];
const observations = [];
for (const name of names) {
  const bytes = await readFile(`${directory}/${name}`);
  const data = JSON.parse(bytes.toString());
  artifacts.push({ path: `${directory}/${name}`, bytes: bytes.length, sha256: hash(bytes) });
  observations.push({
    artifact: name,
    source: data.source,
    quotaBefore: data.quotaBefore,
    quotaAfter: data.quotaAfter,
    stages: data.audit.stages,
    wireRequestDigest: data.audit.wireRequestDigest,
    requestSummary: data.audit.requestSummary,
    result: data.audit.result,
    originalSuccessField: data.success
  });
}
const summary = {
  protocol: SEMANTIC_CORE_TRANSPORT_PROTOCOL,
  status: "PHASE 4 STATUS: BLOCKED — TRANSPORT ROOT CAUSE UNRESOLVED",
  qualificationOutcome: "INSUFFICIENT_EVIDENCE",
  empiricalConditionCreated: false,
  empiricalAttempts: 0,
  generationDiagnosticRequests: 3,
  canaryCSubmitted: false,
  furtherGenerationAllowed: false,
  rootCauseAssessment: {
    localization: "MINIMAL_STRICT_STRUCTURED_REQUEST_RETURNED_HTTP_400_WITH_NOVITA_PROVENANCE",
    exactReturnedReason: "UNSPECIFIED",
    exactRootCauseConfirmed: false,
    original011CauseRetroactivelyProven: false
  },
  historicalHead,
  historicalOutcome: "NOT_QUALIFIED",
  historicalFailure: "INFRASTRUCTURE_FAILURE",
  historicalArtifacts,
  publicBenchmarkMaturity: "BM2",
  scientificMaturity: "UNVALIDATED_PROXY",
  corePromotion: "NOT_PROMOTED",
  scientificAuthority: "NONE",
  bmMaturityAuthority: "NONE",
  artifacts,
  observations
};
await writeFile(
  `${directory}/transport-diagnostic-final.json`,
  JSON.stringify(summary, null, 2) + "\n",
  { flag: "wx" }
);
await writeFile(
  `${directory}/protocol.json`,
  JSON.stringify(
    {
      ...SEMANTIC_CORE_TRANSPORT_PROTOCOL,
      phase: "PROSPECTIVE_ENGINEERING_DIAGNOSTIC_ONLY",
      empiricalImplementation: "NOT_ACTIVATED",
      empiricalCondition: null
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
await writeFile(
  `${directory}/qualification-status.json`,
  JSON.stringify(
    {
      artifactKind: "ENGINEERING_GATE_STATUS_NOT_EMPIRICAL_QUALIFICATION_RECORD",
      protocolId: SEMANTIC_CORE_TRANSPORT_PROTOCOL.protocolId,
      protocolVersion: "0.1.2",
      qualificationOutcome: "INSUFFICIENT_EVIDENCE",
      scheduledEmpiricalAttempts: 72,
      actualEmpiricalAttempts: 0,
      empiricalCondition: null,
      strictStructuredCanaryGate: "BLOCKED",
      rootCauseConfirmed: false,
      scientificAuthority: "NONE",
      bmMaturityAuthority: "NONE"
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
const report = `# Phase 4.1 evidence report — prospective protocol 0.1.2

${summary.status}

qualificationOutcome = \`INSUFFICIENT_EVIDENCE\`

Minimal pinned generation received HTTP 200 with the selected model, Novita and cost exactly zero. The flat strict JSON-schema canary and one final bounded error-reason inspection both received HTTP 400 with Novita error provenance. The failing structured-request path is localized; the exact returned reason is still UNSPECIFIED. No claim of an exact transport root cause or completed provider repair is justified. The ladder is closed after three engineering POSTs. Canary C and all 72 prospective benchmark requests were not sent.

PR [#166](https://github.com/Logorythmus-org/Semantiq/pull/166) stays Draft. Issue [#165](https://github.com/Logorythmus-org/Semantiq/issues/165) stays open. Public Semantic Core stays BM2 / UNVALIDATED_PROXY / NOT_PROMOTED. No merge, automatic BM3 proposal, scientific validation, BM4/BM5, leaderboard, Cyber or release.

## Preserved history

0.1.0 was blocked before execution by its single-window capacity rule. 0.1.1 retains all 72 terminal SUBJECT_ERROR / PROVIDER_REJECTION attempts and permanently remains NOT_QUALIFIED with INFRASTRUCTURE_FAILURE. Its original adapter omitted HTTP status and request stages, so its exact generation POST count and rejection reason remain unverified. New transport findings cannot retrospectively relabel those observations.

All ${historicalArtifacts.length} tracked 0.1.1 evidence files were compared byte-for-byte with historical head ${historicalHead}; every file matched. The [unaltered 0.1.1 report](SEMANTIC_CORE_PHASE4_0.1.1_EVIDENCE_REPORT.md) and all original captures, journals, checkpoints, S04/S05/S09/S10, replay, qualification record and inventories remain available. The [final diagnostic inventory](../../${directory}/transport-diagnostic-final.json) records their original-byte hashes. No successful observation replaces any historical failure.

## Fresh discovery and actual requests

Every diagnostic freshly checked the selected alias apodex/apodex-1.1-mini:free, canonical apodex/apodex-1.1-mini-20261001, eligible Novita endpoint novita/bf16, zero prompt/completion and all other advertised monetary prices, structured-output parameters and authenticated capacity. The provider catalogue separately returned the routing slug novita. Base-slug routing was allowed only with exactly the one expected endpoint in fresh discovery; model/provider fallback was disabled. No paid inference or purchase was authorized or used. The response does not independently attest the endpoint tag; its provenance is bound to the observed unique catalogue endpoint, a mutable external condition.

| Diagnostic | Request condition | HTTP | Result | Quota before → after |
| --- | --- | --- | --- | --- |
${observations.map((o) => `| ${o.artifact} | ${o.requestSummary.responseFormat}, max_tokens=${o.requestSummary.maxTokens}, selector=novita | ${o.result.httpStatus} | ${o.result.classification ?? "selected model/provider; cost=0; original output check false"} | ${o.quotaBefore.used}/${o.quotaBefore.remaining} → ${o.quotaAfter.used}/${o.quotaAfter.remaining} |`).join("\n")}

Each artifact retains its exact source commit/tree, wire digest, ordered audit stages, bounded HTTP projection and quota observations. All three reached POST invocation, response headers, bounded body and parsing stages. These retained stages establish three diagnostic submissions with HTTP responses; request counters do not establish their count. A's immediate post-counter still showed zero, while the next authenticated observation showed used=1. This demonstrates why no exact POST or inference count is inferred from quota.

A originally required the literal text OK in addition to successful transport; that additional check was false. A [separate later gate assessment](../../${directory}/canary-A-transport-gate-analysis.json) recognizes the recorded HTTP/model/provider/zero-cost transport proof without overwriting the original artifact or claiming an observed OK answer. B failed before C was eligible. Its first sanitizer incorrectly attributed a generic 400 to request validation despite naming Novita; that snapshot stays unchanged. The final inspection uses the repaired upstream-provenance classification and again reports 400, UPSTREAM_PROVIDER_REJECTION and UNSPECIFIED. No arbitrary error message or raw upstream body is retained. This lack of a recognized reason is an explicit diagnostic limitation, not proof of a particular unsupported keyword.

## Hypothesis findings and remaining uncertainty

- H1: documented provider slug novita is separately represented and minimal generation succeeded under its unique-endpoint policy. The reviewed metadata reference does not prove that the old tag novita/bf16 is contractually interchangeable with that routing slug. No undocumented selector was tested, and H1 is not proven as the cause of the historical failures.
- H2: the simple flat strict schema failed without oneOf, not or const. The exact benchmark schema was not sent. Therefore complexity is not necessary to reproduce a structured-request rejection, but a specific unsupported keyword or general lack of JSON-schema support is not established.
- H3: selected model, disabled fallback, parameter requirement and prompt/completion price ceilings were accepted by minimal A. B also changed max_tokens from 16 to 128 and used a different synthetic prompt; the observations do not isolate every individual field. Old auxiliary max_price fields were not reproduced, so their role remains unproven.
- H4: the inspected rejection identifies Novita as upstream provenance. The exact upstream code/type/parameter and recognized reason were unavailable. This supports locating the current rejection at the upstream-linked structured-request path, but not inventing a precise provider explanation.

The request construction and observability repair are implemented prospectively in [protocol 0.1.2](SEMANTIC_CORE_PHASE4_TRANSPORT_PROTOCOL.md). The selected strict response path remains blocked. This is not a completed empirical implementation or evidence of a repaired provider capability.

## Qualification and evidence boundary

No 0.1.2 empirical condition, condition digest or source freeze was created. No new S04 benchmark records, S05 studies, S09 qualification packages, empirical regression capture or S10 promotion assessment is fabricated from these canaries. The [engineering qualification status](../../${directory}/qualification-status.json) says INSUFFICIENT_EVIDENCE and zero empirical attempts; it deliberately is not an empirical qualification record.

After a proven structured transport repair, a new source/tree, serializer, routing policy, endpoint/model provenance, response-format contract and digest, prompt inventory, pack/evaluator/metrics must be frozen before run 1. The primary study remains exactly 3 × 24 = 72, complete independent requests in atomic quota-window runs with no replacements. Accuracy is not a BM3 gate. Canonical local response validation remains strict, with no repair, fuzzy inference or oracle exposure. All empirical integrity, replay, S05 accounting, S09 verification and post-live S10 gates still apply. The historical 0.1.1 condition cannot be resumed or compared as successful model evidence.

## Verification and PR boundary

Focused transport and historical qualification tests initially passed: 3 files, 61 tests. The final transport suite additionally passes all 24 tests, including conservative generic-400 and HTTP-200 embedded-error classification. These checks cover safe HTTP 400/401/402/429, upstream provenance, raw-body/credential exclusion, wire digests, separate routing identity, ordered POST stages, schema paths, exact local parsing, canary exclusion from qualification and byte-identical historical evidence. Lint, TypeScript, formatting, documentation, boundaries and workspace build passed. Separate network-free replay reproduces all 72 historical evaluations exactly. Full regression and exact current-head GitHub CI are recorded in the final handoff after this report is committed; no earlier head's green CI is asserted for a new head. An initial full run overlapped the final source correction and is not used as a validation claim; the full run is repeated on the committed source.

The exact root-cause and working structured-canary gates remain unresolved, so PR readiness is blocked even if CI is green. All available diagnostic evidence is retained. No additional generation is performed in this bounded step.
`;
await writeFile("Docs/benchmarks/SEMANTIC_CORE_PHASE4_EVIDENCE_REPORT.md", report);
console.log(
  JSON.stringify({
    status: summary.status,
    historicalArtifactsVerified: historicalArtifacts.length,
    diagnosticRequests: 3,
    empiricalAttempts: 0
  })
);
