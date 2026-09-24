import { execFile } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  LongHorizonTestingEngine,
  canonicalJson,
  computeSha256,
  type LongHorizonScenarioSpec
} from "../../sandbox-contracts/src/index.js";
import { EvidenceSystem, EvidenceVerifier } from "./evidence.js";
import {
  EVIDENCE_COMPLETENESS_DIMENSIONS,
  type EvidencePackageInput,
  type EvidenceValue
} from "./evidence-types.js";
import {
  CONFIG_DIGEST,
  S12_SUBJECT,
  S12LocalToolExecutor,
  mapExactRepeatabilityToS05,
  type OpenRouterMessage,
  type OpenRouterTransport,
  type S12ExecutionCapture,
  mapCaptureToBehavioralTrace
} from "./s12-openrouter-feasibility.js";
import { S12FinalStateVerifier, type S12VerifierRuntime } from "./s12-final-state-verifier.js";
import { OpenRouterSubjectAdapter } from "./s12-openrouter-feasibility.js";
import {
  S12QualificationRunner,
  type S12OrderedCaptureEvent,
  type S12QualificationMode,
  type S12QualificationResult
} from "./s12-qualification-runner.js";

const execFileAsync = promisify(execFile);
export const S12_CANONICAL_EVALUATOR = {
  evaluatorId: "LongHorizonTestingEngine.evaluateLongHorizonTrajectory",
  evaluatorVersion: "0.1.0"
} as const;
export const S12_CANONICAL_METRIC = {
  metricId: "long_horizon_resilience_index",
  metricVersion: "0.1.0"
} as const;
export const S12_AUTHORITATIVE_VERIFIER_DIGEST =
  "4c421830e18947701bacc01c921addb62c62077a455698193e4af074200fc298";
export const S12_FIXTURE_IDENTITY = {
  scenarioId: "s12_lh_config_migration_feasibility",
  scenarioVersion: "0.1.1",
  fixtureDigest: "47dbb3c89b5a56d74710e80205a86a691be0fbb1301b2c3f9147a1af614cee63"
} as const;

export interface S12CanonicalQualificationSummary {
  readonly qualification: S12QualificationResult;
  readonly traceDigest?: string;
  readonly evaluator?: typeof S12_CANONICAL_EVALUATOR;
  readonly metric?: typeof S12_CANONICAL_METRIC & { readonly value: number };
  readonly exactReplay?: boolean;
  readonly s05?: ReturnType<typeof mapExactRepeatabilityToS05>;
  readonly s09?: {
    readonly packageId: string;
    readonly packageDigest: string;
    readonly internalVerification: string;
    readonly authority: "INTERNAL_CONSISTENCY_ONLY";
    readonly scientificAuthority: "NONE";
  };
}

export class S12CanonicalQualificationRunner {
  constructor(private readonly transport: OpenRouterTransport) {}

  async run(input: {
    readonly mode?: S12QualificationMode;
    readonly liveAuthorized?: boolean;
    readonly workspaceRoot: string;
    readonly fixtureDigest: string;
    readonly environmentDigest: string;
    readonly implementationSha: string;
    readonly implementationTree: string;
    readonly messages: readonly OpenRouterMessage[];
  }): Promise<S12CanonicalQualificationSummary> {
    if (input.fixtureDigest !== S12_FIXTURE_IDENTITY.fixtureDigest)
      return {
        qualification: {
          mode: input.mode ?? "DRY_RUN",
          modelRequestCount: 0,
          terminalStatus: "PREFLIGHT_BLOCKED",
          events: [],
          structuredFailure: {
            code: "FIXTURE_IDENTITY_DRIFT",
            detail: `Qualification requires ${S12_FIXTURE_IDENTITY.scenarioId}@${S12_FIXTURE_IDENTITY.scenarioVersion}.`
          },
          configDigest: CONFIG_DIGEST,
          scientificAuthority: "NONE"
        }
      };
    let canonical: Omit<S12CanonicalQualificationSummary, "qualification"> = {};
    const adapter = new OpenRouterSubjectAdapter(
      this.transport,
      (input.mode ?? "DRY_RUN") === "DRY_RUN" ? () => "dry-run-non-secret" : undefined
    );
    const executor = new S12LocalToolExecutor(nodeToolOperations());
    const runner = new S12QualificationRunner(adapter, executor, {
      verifyFinalState: async () =>
        new S12FinalStateVerifier(S12_AUTHORITATIVE_VERIFIER_DIGEST).verify(
          nodeVerifierRuntime(input.workspaceRoot)
        ),
      evaluate: async (events) => {
        canonical = evaluateCanonical(events, input);
        return canonical;
      },
      packageEvidence: async ({ runId, attemptId, verification, evaluation }) => {
        const packaged = createCanonicalS09Package({
          runId: String(runId),
          attemptId: String(attemptId),
          fixtureDigest: input.fixtureDigest,
          environmentDigest: input.environmentDigest,
          implementationSha: input.implementationSha,
          implementationTree: input.implementationTree,
          verification,
          evaluation: evaluation as Omit<S12CanonicalQualificationSummary, "qualification">
        });
        canonical = { ...canonical, s09: packaged };
        return packaged;
      }
    });
    const qualification = await runner.run(input);
    return { qualification, ...canonical };
  }
}

function evaluateCanonical(
  events: readonly S12OrderedCaptureEvent[],
  input: { readonly fixtureDigest: string; readonly environmentDigest: string }
): Omit<S12CanonicalQualificationSummary, "qualification" | "s09"> {
  const capture = captureFromEvents(events, input.fixtureDigest, input.environmentDigest);
  const firstTrace = mapCaptureToBehavioralTrace(capture);
  const secondTrace = mapCaptureToBehavioralTrace(structuredClone(capture));
  const firstTraceDigest = computeSha256(canonicalJson(firstTrace));
  const secondTraceDigest = computeSha256(canonicalJson(secondTrace));
  const engine = new LongHorizonTestingEngine();
  const first = engine.evaluateLongHorizonTrajectory(
    S12_SCENARIO,
    S12_SUBJECT.subjectId,
    firstTrace
  );
  const second = engine.evaluateLongHorizonTrajectory(
    S12_SCENARIO,
    S12_SUBJECT.subjectId,
    secondTrace
  );
  const firstMetric = first.longHorizonResilienceIndex;
  const secondMetric = second.longHorizonResilienceIndex;
  const exactReplay = firstTraceDigest === secondTraceDigest && firstMetric === secondMetric;
  return {
    traceDigest: firstTraceDigest,
    evaluator: S12_CANONICAL_EVALUATOR,
    metric: { ...S12_CANONICAL_METRIC, value: firstMetric },
    exactReplay,
    s05: mapExactRepeatabilityToS05(
      [firstTraceDigest, secondTraceDigest],
      ["trace:s12:first", "trace:s12:replay"]
    )
  };
}

function captureFromEvents(
  events: readonly S12OrderedCaptureEvent[],
  fixtureDigest: string,
  environmentDigest: string
): S12ExecutionCapture {
  const timestamp = events[0]?.timestamp ?? "1970-01-01T00:00:00.000Z";
  const attempt = events.find((event) => event.type === "ATTEMPT_CREATED");
  const requests = new Map(
    events
      .filter((event) => event.type === "TOOL_REQUESTED")
      .map((event) => [String(event.payload["callId"]), event] as const)
  );
  const toolEnds = events.filter((event) => event.type === "TOOL_EXECUTION_END");
  return {
    runId: String(attempt?.payload["runId"] ?? "qualification-capture"),
    attemptId: String(attempt?.payload["attemptId"] ?? "qualification-attempt"),
    utcTimestamp: timestamp,
    subjectId: S12_SUBJECT.subjectId,
    modelId: S12_SUBJECT.modelId,
    upstreamModel: S12_SUBJECT.upstreamModelId,
    upstreamProvider: S12_SUBJECT.upstreamProvider,
    configDigest: CONFIG_DIGEST,
    fixtureDigest,
    environmentDigest,
    modelTurns: events
      .filter((event) => event.type === "MODEL_RESPONSE")
      .map((event) => ({
        sequence: event.sequence,
        role: "assistant" as const,
        contentDigest: String(event.payload["contentDigest"] ?? "")
      })),
    toolCalls: toolEnds.map((event) => {
      const callId = String(event.payload["callId"]);
      const requested = requests.get(callId);
      return {
        callId,
        sequence: event.sequence,
        requestedAt: requested?.timestamp ?? event.timestamp,
        completedAt: event.timestamp,
        name: String(requested?.payload["name"] ?? "run_command") as
          | "read_file"
          | "write_file"
          | "list_files"
          | "run_command",
        arguments: (requested?.payload["arguments"] ?? {}) as Record<string, unknown>,
        result: (event.payload["result"] ?? {}) as Record<string, unknown>,
        durationMs: Number(event.payload["durationMs"] ?? 0),
        exitStatus: (event.payload["exitStatus"] ?? "NOT_APPLICABLE") as
          | number
          | "NOT_APPLICABLE"
          | "TIMED_OUT",
        provenance: Array.isArray(event.payload["provenance"])
          ? (event.payload["provenance"] as string[])
          : []
      };
    }),
    artifactMutations: toolEnds.flatMap((event) => {
      const requested = requests.get(String(event.payload["callId"]));
      if (requested?.payload["name"] !== "write_file") return [];
      const args = (requested.payload["arguments"] ?? {}) as Record<string, unknown>;
      const filePath = typeof args["path"] === "string" ? args["path"] : undefined;
      if (!filePath) return [];
      const content = typeof args["content"] === "string" ? args["content"] : undefined;
      return [
        {
          sequence: event.sequence,
          path: filePath,
          operation: "UPDATE" as const,
          ...(content === undefined ? {} : { contentDigest: computeSha256(content) })
        }
      ];
    }),
    terminalStatus: "SUCCEEDED",
    usage: { accounting: "UNAVAILABLE" },
    freeStatusAtExecution: "VERIFIED_ZERO_PRICE",
    retryLineage: [],
    missingness: [],
    scientificAuthority: "NONE"
  };
}

function createCanonicalS09Package(input: {
  readonly runId: string;
  readonly attemptId: string;
  readonly fixtureDigest: string;
  readonly environmentDigest: string;
  readonly implementationSha: string;
  readonly implementationTree: string;
  readonly verification: unknown;
  readonly evaluation: Omit<S12CanonicalQualificationSummary, "qualification">;
}) {
  const known = <T>(value: T): EvidenceValue<T> => ({
    state: "KNOWN",
    value,
    evidenceReferences: ["s12:qualification"]
  });
  const na = (reason: string) => ({ state: "NOT_APPLICABLE" as const, reason });
  const system = new EvidenceSystem({
    hasBenchmark: ({ benchmarkId, benchmarkVersion }) =>
      benchmarkId === "long_horizon" && benchmarkVersion === "0.1.0",
    hasMetric: (identity) =>
      identity.metricId === S12_CANONICAL_METRIC.metricId &&
      identity.metricVersion === S12_CANONICAL_METRIC.metricVersion,
    hasEvaluator: (identity) =>
      identity.evaluatorId === S12_CANONICAL_EVALUATOR.evaluatorId &&
      identity.evaluatorVersion === S12_CANONICAL_EVALUATOR.evaluatorVersion
  });
  const environment = system.createEnvironmentManifest({
    environmentId: "environment:s12-qualification",
    environmentVersion: "0.1.0",
    schemaVersion: "1.0.0",
    platform: known(process.platform),
    architecture: known(process.arch),
    runtime: known("node"),
    runtimeVersion: known(process.version),
    containerImageDigest: na("No container."),
    hardwareClass: known("local"),
    acceleratorClass: na("No accelerator required."),
    locale: known("C"),
    timezonePolicy: known("UTC"),
    environmentVariables: { classification: "NAMES_ONLY_NO_VALUES", names: ["OPENROUTER_API_KEY"] },
    dependencies: [],
    dependencyCompleteness: "PARTIAL",
    networkDependency: "EXTERNAL_PROVIDER",
    toolAvailability: ["node", "pnpm"],
    completeness: "PARTIALLY_CAPTURED",
    limitations: ["Qualification evidence only."],
    scientificAuthority: "NONE"
  });
  const randomization = {
    policy: na("Not applicable."),
    algorithm: na("Not applicable."),
    seed: known(424242),
    scope: na("Not applicable."),
    implementationVersion: na("Not applicable.")
  };
  const conditions = {
    configurationReference: known("configuration:s12"),
    configurationDigest: known(CONFIG_DIGEST),
    language: known("en"),
    toolPolicy: known("S12_BOUNDED_LOCAL_TOOLS"),
    model: known({
      provider: "OpenRouter",
      modelId: S12_SUBJECT.modelId,
      modelVersion: S12_SUBJECT.upstreamModelId
    }),
    modelEvidenceStatuses: ["MODEL_ID_DECLARED", "MODEL_VERSION_KNOWN", "SNAPSHOT_KNOWN"],
    samplingConfigurationReference: known("configuration:s12"),
    randomization
  };
  const execution = system.createExecutionManifest({
    manifestId: `manifest:${input.runId}`,
    manifestVersion: "0.1.0",
    schemaVersion: "1.0.0",
    executionId: input.attemptId,
    executionStatus: "SUCCEEDED",
    targetReference: `result:${input.runId}`,
    benchmarkIdentity: known({ benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" }),
    itemIdentity: known({ itemId: "s12_lh_config_migration_feasibility", itemVersion: "0.1.1" }),
    constructReference: known("long_horizon_resilience"),
    metricIdentity: known(S12_CANONICAL_METRIC),
    evaluatorIdentity: known(S12_CANONICAL_EVALUATOR),
    studyProtocolReference: known("S12_C2_4_R2"),
    comparisonDefinitionReference: na("No comparison."),
    intended: conditions,
    observed: conditions,
    environmentDigest: environment.environmentDigest,
    sourceRevision: {
      gitCommit: known(input.implementationSha),
      gitTree: known(input.implementationTree),
      packageVersion: known("0.1.0-alpha.2"),
      schemaVersions: [{ schemaId: "s12-qualification", schemaVersion: "0.1.0" }]
    },
    inputArtifactIds: ["fixture:s12"],
    expectedOutputArtifactIds: ["result:s12"],
    observedOutputArtifactIds: ["result:s12"],
    evidenceReferences: [
      "benchmark:long-horizon",
      "metric:long-horizon",
      "evaluator:long-horizon",
      "reliability:s12"
    ],
    scientificAuthority: "NONE"
  } as never);
  const digest = (value: unknown) => ({
    algorithm: "SHA_256" as const,
    value: computeSha256(canonicalJson(value)),
    canonicalizationProfile: "semantiq-canonical-json-v1" as const
  });
  const records = [
    [
      "benchmark:long-horizon",
      "BENCHMARK_S02",
      "long_horizon",
      "0.1.0",
      { benchmark: "long_horizon" }
    ],
    [
      "metric:long-horizon",
      "METRIC_S03",
      S12_CANONICAL_METRIC.metricId,
      "0.1.0",
      input.evaluation.metric
    ],
    [
      "evaluator:long-horizon",
      "EVALUATOR_S04",
      S12_CANONICAL_EVALUATOR.evaluatorId,
      "0.1.0",
      input.evaluation.evaluator
    ],
    [
      "reliability:s12",
      "RELIABILITY_S05",
      "s12_exact_repeatability",
      "0.1.0",
      input.evaluation.s05
    ],
    [`result:${input.runId}`, "RESULT", "s12_qualification_result", "0.1.0", input.verification]
  ].map(([referenceId, scope, recordId, recordVersion, value]) => ({
    referenceId: String(referenceId),
    scope,
    recordId: String(recordId),
    recordVersion: String(recordVersion),
    semanticDigest: digest(value),
    availability: "AVAILABLE",
    provenanceReferences: ["s12:qualification"]
  }));
  const artifacts = [
    {
      artifactId: "fixture:s12",
      artifactVersion: "0.1.0",
      kind: "FIXTURE",
      contentDigest: {
        algorithm: "SHA_256",
        value: input.fixtureDigest,
        representation: "CANONICAL_JSON"
      },
      observedContentDigest: {
        algorithm: "SHA_256",
        value: input.fixtureDigest,
        representation: "CANONICAL_JSON"
      },
      mediaType: "application/json",
      availability: "REFERENCED",
      locationClass: "PORTABLE_RELATIVE",
      rightsStatus: "REDISTRIBUTION_ALLOWED",
      provenanceReferences: ["s12:qualification"],
      limitations: []
    },
    {
      artifactId: "result:s12",
      artifactVersion: "0.1.0",
      kind: "REPORT",
      contentDigest: {
        algorithm: "SHA_256",
        value: computeSha256(canonicalJson(input.verification)),
        representation: "CANONICAL_JSON"
      },
      observedContentDigest: {
        algorithm: "SHA_256",
        value: computeSha256(canonicalJson(input.verification)),
        representation: "CANONICAL_JSON"
      },
      mediaType: "application/json",
      availability: "EMBEDDED",
      locationClass: "EMBEDDED",
      rightsStatus: "REDISTRIBUTION_ALLOWED",
      provenanceReferences: ["s12:qualification"],
      limitations: []
    }
  ];
  const packageInput: EvidencePackageInput = {
    packageId: `evidence:${input.runId}`,
    packageVersion: "0.1.0",
    schemaVersion: "1.0.0",
    packageMode: "REFERENTIAL",
    target: {
      referenceId: `result:${input.runId}`,
      scope: "RESULT",
      claimOrResultType: "S12_QUALIFICATION_RESULT"
    },
    records: records as never,
    requirements: [
      {
        requirementId: "fixture",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: "fixture:s12",
        critical: true
      },
      {
        requirementId: "result",
        purpose: "ENGINEERING_CONFORMANCE",
        referenceId: "result:s12",
        critical: true
      }
    ],
    artifacts: artifacts as never,
    executionManifest: execution,
    environmentManifest: environment,
    completeness: EVIDENCE_COMPLETENESS_DIMENSIONS.map((dimension) => ({
      dimension,
      status: ["VALIDITY", "HUMAN_PROTOCOL", "COMPARABILITY"].includes(dimension)
        ? "NOT_APPLICABLE"
        : "COMPLETE",
      critical: ["IDENTITY", "INPUT", "EXECUTION", "OUTPUT"].includes(dimension),
      evidenceReferences: ["s12:qualification"],
      rationale: "Qualification-scoped evidence."
    })) as never,
    chain: [
      {
        fromReference: "benchmark:long-horizon",
        relationship: "USED_INPUT",
        toReference: "fixture:s12"
      },
      { fromReference: "fixture:s12", relationship: "EXECUTED_AS", toReference: input.attemptId },
      {
        fromReference: input.attemptId,
        relationship: "PRODUCED",
        toReference: `result:${input.runId}`
      },
      {
        fromReference: `result:${input.runId}`,
        relationship: "SUPPORTED_BY",
        toReference: "result:s12"
      }
    ],
    determinismClass: "DETERMINISTIC_REPLAY_EXPECTED",
    evaluatorDeterminism: known("DETERMINISTIC"),
    reproducibilityStatus: "MANIFEST_COMPLETE",
    signatureStatus: "NOT_IMPLEMENTED",
    limitations: ["Internal consistency only."],
    scientificAuthority: "NONE"
  };
  const pkg = system.createEvidencePackage(packageInput);
  const verified = new EvidenceVerifier().verify(pkg);
  return {
    packageId: pkg.packageId,
    packageDigest: pkg.packageDigest,
    internalVerification: verified.outcome,
    authority: verified.authority,
    scientificAuthority: "NONE" as const
  };
}

function nodeToolOperations() {
  return {
    readFile: (file: string) => readFile(file, "utf8"),
    writeFile: (file: string, content: string) => writeFile(file, content, "utf8"),
    listFiles: async (directory: string) => (await readdir(directory)).sort(),
    runCommand: async (workspaceRoot: string, command: string, timeoutMs: number) => {
      const [program, ...args] =
        command === "node dist/cli.js"
          ? [process.execPath, "dist/cli.js"]
          : process.platform === "win32"
            ? [process.env["COMSPEC"] ?? "cmd.exe", "/d", "/s", "/c", `pnpm ${command.slice(5)}`]
            : ["pnpm", command.slice(5)];
      try {
        const output = await execFileAsync(program, args, {
          cwd: workspaceRoot,
          timeout: timeoutMs,
          windowsHide: true
        });
        return { exitCode: 0, stdout: output.stdout, stderr: output.stderr };
      } catch (error) {
        const value = error as { code?: number; stdout?: string; stderr?: string };
        return {
          exitCode: typeof value.code === "number" ? value.code : 1,
          stdout: value.stdout ?? "",
          stderr: value.stderr ?? ""
        };
      }
    }
  };
}

function nodeVerifierRuntime(workspaceRoot: string): S12VerifierRuntime {
  const material = async () => ({
    spec: JSON.parse(await readFile(path.join(workspaceRoot, "verifier/spec.json"), "utf8")),
    test: await readFile(path.join(workspaceRoot, "verifier/final-state.test.mjs"), "utf8")
  });
  return {
    verifierMaterialDigest: async () => computeSha256(canonicalJson(await material())),
    artifactExists: async (relative) =>
      stat(path.join(workspaceRoot, relative)).then(
        () => true,
        () => false
      ),
    execute: async (command) => {
      const output = await nodeToolOperations().runCommand(workspaceRoot, command, 600_000);
      return {
        command,
        exitCode: output.exitCode,
        stdoutDigest: computeSha256(output.stdout),
        stderrDigest: computeSha256(output.stderr)
      };
    }
  };
}

const S12_SCENARIO: LongHorizonScenarioSpec = {
  scenarioId: "s12_lh_config_migration_feasibility",
  displayName: "S12 configuration migration feasibility",
  totalHorizonSteps: 120,
  allowedTools: ["read_file", "write_file", "list_files", "run_command"],
  tokenBudgetLimit: 64_000,
  wallClockTimeoutSeconds: 1800,
  milestones: ["M1", "M2", "M3", "M4", "M5", "M6"].map((milestoneId, index) => ({
    milestoneId,
    phase: (
      [
        "DISCOVERY_AND_RECON",
        "ARCHITECTURAL_PLANNING",
        "INCREMENTAL_IMPLEMENTATION",
        "INCREMENTAL_IMPLEMENTATION",
        "INTEGRATION_AND_TESTING",
        "VERIFICATION_AND_FINALIZE"
      ] as const
    )[index]!,
    description: milestoneId,
    targetArtifacts: [],
    validationCriteria: {},
    maxStepBudget: 20
  }))
};
