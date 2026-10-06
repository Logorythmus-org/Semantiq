import { execFileSync } from "node:child_process";
import { mkdir, writeFile, appendFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  runSemanticCoreQualification,
  replaySemanticCoreQualification,
  SemanticCoreOpenRouterSubject,
  SemanticCoreQualificationError
} from "../packages/benchmark/src/index.js";
import {
  semanticCoreCaptureDigest,
  validateSemanticCoreQualificationRecord
} from "../packages/benchmark/src/index.js";
import type { SemanticCoreSubjectConfiguration } from "../packages/benchmark/src/index.js";

const args = process.argv.slice(2).filter((a) => a !== "--");
const allowed = new Set([
  "--mode",
  "--authorize-live",
  "--model",
  "--provider",
  "--route",
  "--seed",
  "--output",
  "--replay",
  "--validation"
]);
const values = new Map<string, string>();
try {
  for (let i = 0; i < args.length; i++) {
    const key = args[i]!;
    if (!allowed.has(key) || values.has(key))
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    if (key === "--authorize-live") values.set(key, "true");
    else {
      const value = args[++i];
      if (!value || value.startsWith("--"))
        throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
      values.set(key, value);
    }
  }
  const mode = values.get("--mode") ?? "dry";
  if (!["dry", "live"].includes(mode))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  if (mode !== "live" && values.has("--authorize-live"))
    throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
  const root = resolve(import.meta.dirname, "..");
  const packRoot = join(root, "fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
  const git = (...arguments_: string[]) =>
    execFileSync("git", ["-c", "core.fsmonitor=false", ...arguments_], {
      cwd: root,
      encoding: "utf8"
    }).trim();
  const source = { gitCommit: git("rev-parse", "HEAD"), gitTree: git("rev-parse", "HEAD^{tree}") };
  if (values.has("--replay")) {
    const data = JSON.parse(await readFile(resolve(values.get("--replay")!), "utf8"));
    if (!data.capture || data.captureDigest !== semanticCoreCaptureDigest(data.capture))
      throw new SemanticCoreQualificationError("REGRESSION_REPLAY_MISMATCH");
    const replay = await replaySemanticCoreQualification(packRoot, data.capture ?? data);
    console.log(JSON.stringify(replay, null, 2));
    if (!replay.exact) process.exitCode = 1;
  } else {
    const modelId = values.get("--model");
    const config: SemanticCoreSubjectConfiguration | undefined = modelId
      ? {
          provider: "OpenRouter",
          modelId,
          snapshotStatus: "MUTABLE_ALIAS",
          providerName: values.get("--provider") ?? "",
          route: values.get("--route") ?? "",
          temperature: 0,
          maxTokens: 128,
          responseFormat: "STRICT_JSON_SCHEMA",
          ...(values.has("--seed") ? { seed: Number(values.get("--seed")) } : {})
        }
      : undefined;
    if (
      mode === "live" &&
      (!values.has("--authorize-live") ||
        !config ||
        !values.has("--output") ||
        git("status", "--porcelain", "--untracked-files=no"))
    )
      throw new SemanticCoreQualificationError("PREFLIGHT_FAILURE");
    const output = values.has("--output") ? resolve(values.get("--output")!) : undefined;
    if (output) await mkdir(output, { recursive: false });
    const repositoryValidation = values.has("--validation")
      ? (JSON.parse(await readFile(resolve(values.get("--validation")!), "utf8")) as {
          sourceCommit: string;
          reportDigest: string;
          status: "PASSED";
        })
      : undefined;
    const result = await runSemanticCoreQualification({
      packRoot,
      source,
      ...(config ? { configuration: config } : {}),
      mode: mode as "dry" | "live",
      ...(repositoryValidation ? { repositoryValidation } : {}),
      authorizeLive: values.has("--authorize-live"),
      ...(mode === "live" ? { subject: new SemanticCoreOpenRouterSubject() } : {}),
      onPreflight: (summary) => console.log(JSON.stringify(summary, null, 2)),
      ...(output
        ? {
            onAttempt: async (attempt) => {
              await appendFile(join(output, "attempts.jsonl"), JSON.stringify(attempt) + "\n", {
                encoding: "utf8"
              });
              console.log(
                JSON.stringify({
                  attemptId: attempt.attemptId,
                  state: attempt.evaluation.state,
                  transport: attempt.observation.status,
                  error: attempt.observation.error
                })
              );
            }
          }
        : {})
    });
    if (result.mode === "LIVE" && !validateSemanticCoreQualificationRecord(result.qualification))
      throw new SemanticCoreQualificationError("EVIDENCE_PACKAGING_FAILURE");
    if (output)
      await writeFile(
        join(output, "qualification.json"),
        JSON.stringify(result, null, 2) + "\n",
        "utf8"
      );
    console.log(
      JSON.stringify(
        result.mode === "LIVE"
          ? result.qualification
          : {
              mode: result.mode,
              empiricalEvidence: false,
              benchmark: result.frozen.benchmark,
              packDigest: result.frozen.packDigest,
              source: result.frozen.source,
              protocol: result.frozen.protocol,
              selectedSubject: result.frozen.subjectConfiguration,
              promptDigest: result.frozen.promptDigest,
              caseCount: result.frozen.cases.length,
              prespecifiedStudies: result.frozen.studies.length,
              scheduledAttempts: result.scheduledAttempts,
              outcome: result.outcome
            },
        null,
        2
      )
    );
  }
} catch (error) {
  // Never forward provider payloads, exception strings, paths or credential values.
  console.error(
    JSON.stringify({
      status: "BLOCKED",
      error: error instanceof SemanticCoreQualificationError ? error.code : "PREFLIGHT_FAILURE"
    })
  );
  process.exitCode = 1;
}
