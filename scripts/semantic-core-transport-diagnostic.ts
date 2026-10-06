import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  runTransportCanary,
  SEMANTIC_CORE_TRANSPORT_PROTOCOL
} from "../packages/benchmark/src/semantic-core-transport-diagnostic.js";

if (process.argv.slice(2).join(" ") !== "--authorize-live")
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
await writeFile(`${directory}/transport-diagnostic.lock`, "ONE_BOUNDED_LADDER_ONLY\n", {
  flag: "wx"
});
for (const kind of ["A", "B", "C"] as const) {
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
  `${directory}/transport-diagnostic.json`,
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
