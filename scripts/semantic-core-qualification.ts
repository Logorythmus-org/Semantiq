import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  runSemanticCoreQualification,
  replaySemanticCoreQualification,
  semanticCoreCaptureDigest,
  SemanticCoreQualificationError
} from "../packages/benchmark/src/index.js";

// Historical CLI is now read-only: all live collection uses the dedicated 0.1.3 command.
try {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const values = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const key = args[i]!;
    if (!["--mode", "--replay"].includes(key) || values.has(key))
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    const value = args[++i];
    if (!value || value.startsWith("--"))
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    values.set(key, value);
  }
  if ((values.get("--mode") ?? "dry") !== "dry")
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const root = resolve(import.meta.dirname, "..");
  const packRoot = join(root, "fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
  if (values.has("--replay")) {
    const data = JSON.parse(await readFile(resolve(values.get("--replay")!), "utf8"));
    if (!data.capture || data.captureDigest !== semanticCoreCaptureDigest(data.capture))
      throw new SemanticCoreQualificationError("REGRESSION_REPLAY_MISMATCH");
    const replay = await replaySemanticCoreQualification(packRoot, data.capture);
    console.log(JSON.stringify(replay));
    if (!replay.exact) process.exitCode = 1;
  } else {
    const git = (...parameters: string[]) =>
      execFileSync("git", ["-c", "core.fsmonitor=false", ...parameters], {
        cwd: root,
        encoding: "utf8"
      }).trim();
    const result = await runSemanticCoreQualification({
      packRoot,
      source: { gitCommit: git("rev-parse", "HEAD"), gitTree: git("rev-parse", "HEAD^{tree}") },
      protocolVersion: "0.1.1",
      mode: "dry"
    });
    console.log(JSON.stringify(result));
  }
} catch (error) {
  console.error(
    JSON.stringify({
      status: "BLOCKED",
      error: error instanceof SemanticCoreQualificationError ? error.code : "PREFLIGHT_FAILURE"
    })
  );
  process.exitCode = 1;
}
