import { readFile, writeFile } from "node:fs/promises";
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
const previous = JSON.parse(await readFile(`${directory}/transport-canary-B.json`, "utf8"));
if (
  previous.success !== false ||
  previous.audit?.result?.httpStatus !== 400 ||
  previous.audit?.result?.upstreamProvider !== "Novita" ||
  previous.audit?.result?.reason !== "UNSPECIFIED"
)
  throw new Error("UNRESOLVED_STRUCTURED_REJECTION_REQUIRED");
// The third and final engineering request resolves a missing bounded rejection reason.
// No replacement qualification observation, no C, no further probes or benchmark run.
await writeFile(
  `${directory}/transport-inspection.lock`,
  "MAXIMUM_THREE_DIAGNOSTIC_REQUESTS_FINAL_INSPECTION\n",
  { flag: "wx" }
);
const source = {
  gitCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  gitTree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim()
};
const result = await runTransportCanary("B");
await writeFile(
  `${directory}/transport-canary-B-inspection.json`,
  JSON.stringify(
    {
      protocol: SEMANTIC_CORE_TRANSPORT_PROTOCOL,
      source,
      purposeDetail: "FINAL_BOUNDED_ERROR_REASON_INSPECTION",
      observedAt: new Date().toISOString(),
      ...result
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
console.log(JSON.stringify({ kind: "B_INSPECTION", audit: result.audit, success: result.success }));
