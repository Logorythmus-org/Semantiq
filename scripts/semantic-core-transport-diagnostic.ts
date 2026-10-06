import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  runTransportCanary,
  SEMANTIC_CORE_TRANSPORT_PROTOCOL
} from "../packages/benchmark/src/semantic-core-transport-diagnostic.js";

const continuation =
  process.argv.slice(2).join(" ") === "--authorize-live --continue-after-A-http-success";
if (process.argv.slice(2).join(" ") !== "--authorize-live" && !continuation)
  throw new Error("EXPLICIT_DIAGNOSTIC_AUTHORIZATION_REQUIRED");
if (
  execFileSync(
    "git",
    ["-c", "core.fsmonitor=false", "status", "--porcelain", "--untracked-files=no"],
    { encoding: "utf8" }
  ).trim()
)
  throw new Error("CLEAN_COMMITTED_SOURCE_REQUIRED");
const directory = "fixtures/semantic-core-qualification-0.1.2";
await mkdir(directory, { recursive: true });
const source = {
  gitCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  gitTree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim()
};
const results: Awaited<ReturnType<typeof runTransportCanary>>[] = [];
// Exclusive reservation before any POST prevents accidental reruns or replacement canaries.
if (continuation) {
  const prior = JSON.parse(await readFile(`${directory}/transport-canary-A.json`, "utf8"));
  const result = prior.audit?.result;
  if (
    result?.httpStatus !== 200 ||
    result.returnedModel !== "apodex/apodex-1.1-mini:free" ||
    result.returnedProvider !== "Novita" ||
    result.usage?.cost !== 0 ||
    prior.audit?.stages?.at(-1) !== "GENERATION_RESPONSE_PARSED"
  )
    throw new Error("A_TRANSPORT_SUCCESS_NOT_PROVEN");
  // Original output-check result remains immutable; this is a separate later gate analysis.
  await writeFile(
    `${directory}/canary-A-transport-gate-analysis.json`,
    JSON.stringify(
      {
        source,
        originalArtifact: "transport-canary-A.json",
        assessment: "HTTP_MODEL_PROVIDER_USAGE_ZERO_COST_TRANSPORT_GATE_SATISFIED",
        originalOutputCheckSatisfied: prior.success,
        additionalPostRequests: 0,
        scientificAuthority: "NONE",
        bmMaturityAuthority: "NONE"
      },
      null,
      2
    ) + "\n",
    { flag: "wx" }
  );
}
await writeFile(
  `${directory}/${continuation ? "transport-continuation" : "transport-diagnostic"}.lock`,
  "ONE_BOUNDED_LADDER_ONLY\n",
  {
    flag: "wx"
  }
);
for (const kind of continuation ? (["B", "C"] as const) : (["A", "B", "C"] as const)) {
  const result = await runTransportCanary(kind);
  results.push(result);
  await writeFile(
    `${directory}/transport-canary-${kind}.json`,
    JSON.stringify({ protocol: SEMANTIC_CORE_TRANSPORT_PROTOCOL, source, ...result }, null, 2) +
      "\n",
    { flag: "wx" }
  );
  console.log(JSON.stringify({ kind, success: result.success, audit: result.audit }));
  if (!result.success) break;
  if (kind !== "C") await new Promise((resolve) => setTimeout(resolve, 3500));
}
await writeFile(
  `${directory}/${continuation ? "transport-diagnostic-continuation" : "transport-diagnostic"}.json`,
  JSON.stringify(
    {
      protocol: SEMANTIC_CORE_TRANSPORT_PROTOCOL,
      source,
      observedAt: new Date().toISOString(),
      results,
      empiricalConditionCreated: false,
      qualificationOutcome: "INSUFFICIENT_EVIDENCE",
      scientificAuthority: "NONE",
      bmMaturityAuthority: "NONE"
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
