import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { S12CanonicalQualificationRunner } from "../packages/benchmark/src/s12-canonical-qualification.js";
import {
  S12_EXECUTION_STRATA,
  S12_SUBJECT,
  s12ProspectiveConfigDigest,
  type S12ExecutionContract,
  type OpenRouterGenerationResponse,
  type OpenRouterTransport
} from "../packages/benchmark/src/s12-openrouter-feasibility.js";
import { canonicalJson, computeSha256 } from "../packages/sandbox-contracts/src/index.js";

const FROZEN_FIXTURE_DIGEST = "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63";
const FROZEN_VERIFIER_DIGEST = "4c421830e18947701bacc01c921addb62c62077a455698193e4af074200fc298";

const selection = parseExecutionStratum(process.argv.slice(2));
if (!selection.ok) {
  process.stderr.write(`${selection.error}\n`);
  process.exit(2);
}
const executionContract = selection.contract;
const configurationDigest = s12ProspectiveConfigDigest(executionContract);

const mode = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1]
  : "dry-run";
const authorized = process.argv.includes("--authorize-live");
const workspaceIndex = process.argv.indexOf("--workspace");
const workspaceRoot = workspaceIndex >= 0 ? process.argv[workspaceIndex + 1] : undefined;
const executionCondition = `S12_EXECUTION_CONDITION ${canonicalJson({ ...executionContract, configurationDigest })}\n`;
if (mode !== "dry-run" && mode !== "live") {
  console.error("mode must be dry-run or live");
  process.exitCode = 2;
} else if (mode === "live" && !authorized) {
  process.stderr.write(executionCondition);
  process.stdout.write(
    JSON.stringify({
      mode: "LIVE_QUALIFICATION",
      terminalStatus: "INSTRUMENTATION_FAILURE",
      failure: "LIVE_AUTHORIZATION_REQUIRED",
      REAL_GENERATION_REQUESTS: 0
    }) + "\n"
  );
} else {
  process.stderr.write(executionCondition);
  if (!workspaceRoot) throw new Error("--workspace is required");
  const resolvedWorkspace = path.resolve(workspaceRoot);
  const identity = JSON.parse(
    readFileSync(path.join(resolvedWorkspace, "fixture-identity.json"), "utf8")
  ) as Record<string, unknown>;
  if (
    identity["fixtureDigest"] !== FROZEN_FIXTURE_DIGEST ||
    identity["verifierDigest"] !== FROZEN_VERIFIER_DIGEST
  ) {
    process.stdout.write(
      canonicalJson({
        mode: mode === "live" ? "LIVE_QUALIFICATION" : "DRY_RUN",
        terminalStatus: "PREFLIGHT_BLOCKED",
        failure: "FIXTURE_IDENTITY_DRIFT",
        REAL_GENERATION_REQUESTS: 0
      }) + "\n"
    );
    process.exit(2);
  }
  const implementationSha = gitRevision("HEAD");
  const implementationTree = gitRevision("HEAD^{tree}");
  const environmentDigest = computeSha256(
    canonicalJson({ platform: process.platform, architecture: process.arch, node: process.version })
  );
  const taskInstruction = readFileSync(path.join(resolvedWorkspace, "TASK.md"), "utf8");
  const transport: OpenRouterTransport =
    mode === "dry-run"
      ? dryTransport()
      : new (
          await import("../packages/benchmark/src/s12-openrouter-transport.js")
        ).OpenRouterHttpTransport();
  const result = await new S12CanonicalQualificationRunner(transport).run({
    mode: mode === "live" ? "LIVE_QUALIFICATION" : "DRY_RUN",
    liveAuthorized: authorized,
    workspaceRoot: resolvedWorkspace,
    fixtureDigest: FROZEN_FIXTURE_DIGEST,
    environmentDigest,
    implementationSha,
    implementationTree,
    configurationDigest,
    executionContract,
    taskInstruction
  });
  process.stdout.write(
    canonicalJson({
      ...result,
      REAL_GENERATION_REQUESTS: mode === "live" ? result.qualification.modelRequestCount : 0,
      REAL_SUBJECT_OBSERVATIONS:
        mode === "live" && result.qualification.attemptId !== undefined ? 1 : 0
    }) + "\n"
  );
}

function parseExecutionStratum(
  args: readonly string[]
):
  | { readonly ok: true; readonly contract: S12ExecutionContract }
  | { readonly ok: false; readonly error: string } {
  const values: string[] = [];
  let missingValue = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index]!;
    if (argument === "--execution-stratum") {
      const value = args[index + 1];
      if (value === undefined || value.length === 0 || value.startsWith("--")) {
        missingValue = true;
      } else {
        values.push(value);
        index++;
      }
    } else if (argument.startsWith("--execution-stratum=")) {
      const value = argument.slice("--execution-stratum=".length);
      if (value.length === 0) missingValue = true;
      else values.push(value);
    }
  }

  if (values.length + Number(missingValue) > 1)
    return { ok: false, error: "--execution-stratum may be provided only once." };
  if (missingValue)
    return { ok: false, error: "--execution-stratum requires a value: 10t or 20t." };
  const value = values[0];
  if (value === undefined || value === "10t")
    return { ok: true, contract: S12_EXECUTION_STRATA.S12_10_TURNS };
  if (value === "20t") return { ok: true, contract: S12_EXECUTION_STRATA.S12_20_TURNS };
  return { ok: false, error: "Unsupported --execution-stratum value. Use 10t or 20t." };
}

function gitRevision(revision: string): string {
  return execFileSync("git", ["rev-parse", revision], { encoding: "utf8" }).trim();
}

function dryTransport(): OpenRouterTransport {
  return {
    async listModels() {
      return [
        {
          id: S12_SUBJECT.modelId,
          pricing: { prompt: "0", completion: "0" },
          supportedParameters: [
            "tools",
            "tool_choice",
            "temperature",
            "top_p",
            "max_tokens",
            "seed"
          ]
        }
      ];
    },
    async listEndpoints() {
      return [
        {
          name: `Cohere | ${S12_SUBJECT.upstreamModelId}`,
          modelId: S12_SUBJECT.modelId,
          providerName: "Cohere",
          tag: "cohere",
          pricing: { prompt: "0", completion: "0" },
          supportedParameters: [
            "tools",
            "tool_choice",
            "temperature",
            "top_p",
            "max_tokens",
            "seed"
          ]
        }
      ];
    },
    async generate(): Promise<OpenRouterGenerationResponse> {
      return {
        responseId: "dry-run",
        model: S12_SUBJECT.modelId,
        provider: "Cohere",
        message: { role: "assistant", content: "dry-run completion" },
        toolCalls: [],
        usage: { inputTokens: 0, outputTokens: 0 }
      };
    }
  };
}
