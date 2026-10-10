import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { runSemanticCoreCanaryD } from "../packages/benchmark/src/semantic-core-local-transport.js";
import { SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL } from "../packages/benchmark/src/semantic-core-local-response.js";

if (process.argv.slice(2).join(" ") !== "--authorize-live")
  throw new Error("EXPLICIT_CANARY_AUTHORIZATION_REQUIRED");
const git = (...args: string[]) =>
  execFileSync("git", ["-c", "core.fsmonitor=false", ...args], { encoding: "utf8" }).trim();
if (git("status", "--porcelain", "--untracked-files=no"))
  throw new Error("CLEAN_COMMITTED_SOURCE_REQUIRED");
const directory = "fixtures/semantic-core-qualification-0.1.3";
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/canary-D.lock`, "EXACTLY_ONE_CANARY_D_NO_REPLACEMENT\n", {
  flag: "wx"
});
const source = { gitCommit: git("rev-parse", "HEAD"), gitTree: git("rev-parse", "HEAD^{tree}") };
const result = await runSemanticCoreCanaryD();
await writeFile(
  `${directory}/canary-D.json`,
  JSON.stringify(
    {
      protocol: SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL,
      source,
      observedAt: new Date().toISOString(),
      ...result
    },
    null,
    2
  ) + "\n",
  { flag: "wx" }
);
console.log(
  JSON.stringify({
    kind: "D",
    success: result.success,
    state: result.state,
    httpStatus: "httpStatus" in result ? result.httpStatus : null,
    replayExact: result.replayExact,
    empiricalRequests: 0
  })
);
