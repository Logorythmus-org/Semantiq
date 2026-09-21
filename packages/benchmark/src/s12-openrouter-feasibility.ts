import path from "node:path";

import {
  canonicalJson,
  computeSha256,
  type BehavioralTraceEvent
} from "../../sandbox-contracts/src/index.js";
import type {
  ArtifactReference,
  EvidencePackage,
  EvidencePackageInput,
  EvidenceRecordReference,
  ExecutionManifest,
  SemanticDigest
} from "./evidence-types.js";
import { EvidenceSystem } from "./evidence.js";

export const S12_FEASIBILITY_AUTHORITY = "NONE" as const;
export const S12_EVIDENCE_AUTHORITY = "INTERNAL_CONSISTENCY_ONLY" as const;

export const S12_SUBJECT = {
  subjectId: "s12-lh-openrouter-cohere-north-mini-code-001",
  gateway: "OpenRouter",
  modelId: "cohere/north-mini-code:free",
  upstreamModelId: "cohere/north-mini-code-20260617:free",
  upstreamProvider: "Cohere",
  endpointTag: "cohere",
  api: "OpenRouter REST / OpenAI-compatible chat completion surface",
  freeOnly: true,
  modelFallback: "NONE",
  providerFallback: "NONE",
  contextLimit: 256_000,
  providerOutputLimit: 64_000,
  maxAttempts: 10,
  maxWallTimePerRunMs: 30 * 60 * 1000,
  dataGovernance: {
    zdr: "NOT_AVAILABLE",
    upstreamTrainingUse: "NO_REPORTED_TRAINING",
    upstreamRetention: "30_DAYS_REPORTED",
    permittedData: "SYNTHETIC_FIRST_PARTY_NON_SENSITIVE_ONLY"
  },
  scientificAuthority: S12_FEASIBILITY_AUTHORITY
} as const;

export type Explicitness = "EXPLICIT" | "DEFAULT_RECORDED" | "NOT_SUPPORTED" | "UNKNOWN";

export interface FrozenValue<T> {
  readonly state: Explicitness;
  readonly value?: T | undefined;
}

export const S12_SUBJECT_CONFIGURATION = {
  systemInstruction: {
    state: "EXPLICIT",
    value:
      "Complete only the frozen synthetic configuration-migration task using declared local tools. Do not access networks, secrets, external repositories, or verifier material."
  },
  temperature: { state: "EXPLICIT", value: 1 },
  topP: { state: "EXPLICIT", value: 1 },
  maxOutput: { state: "EXPLICIT", value: 8192 },
  seed: { state: "EXPLICIT", value: 424242 },
  thinkingConfiguration: { state: "EXPLICIT", value: { enabled: false } },
  toolChoice: { state: "EXPLICIT", value: "auto" },
  responseConfiguration: { state: "EXPLICIT", value: "TEXT_AND_TOOL_CALLS" },
  historyEncoding: { state: "EXPLICIT", value: "OPENAI_CHAT_MESSAGES_V1" },
  timeoutMs: { state: "EXPLICIT", value: S12_SUBJECT.maxWallTimePerRunMs },
  retryPolicy: { state: "EXPLICIT", value: { maximumAttempts: S12_SUBJECT.maxAttempts } },
  caching: { state: "EXPLICIT", value: "DISABLED" },
  batching: { state: "EXPLICIT", value: "DISABLED" },
  safetyConfiguration: { state: "UNKNOWN" }
} as const satisfies Record<string, FrozenValue<unknown>>;

export const S12_TOOL_DECLARATIONS = [
  { name: "read_file", input: { path: "workspace-relative string" } },
  { name: "write_file", input: { path: "workspace-relative string", content: "string" } },
  { name: "list_files", input: { path: "workspace-relative string" } },
  { name: "run_command", input: { command: "allowlisted command", timeoutMs: "integer" } }
] as const;

const digestHex = (value: unknown): string => computeSha256(canonicalJson(value));
const semanticDigest = (value: unknown): SemanticDigest => ({
  algorithm: "SHA_256",
  value: digestHex(value),
  canonicalizationProfile: "semantiq-canonical-json-v1"
});

export const SYSTEM_PROMPT_DIGEST = digestHex(S12_SUBJECT_CONFIGURATION.systemInstruction.value);
export const TOOL_DEFINITION_DIGEST = digestHex(S12_TOOL_DECLARATIONS);
export const CONFIG_DIGEST = digestHex({
  subject: S12_SUBJECT,
  configuration: S12_SUBJECT_CONFIGURATION,
  systemPromptDigest: SYSTEM_PROMPT_DIGEST,
  toolDefinitionDigest: TOOL_DEFINITION_DIGEST
});

export const S12_PREFLIGHT_FAILURES = [
  "FREE_TIER_UNAVAILABLE",
  "SUBJECT_IDENTITY_DRIFT",
  "PROVIDER_ROUTE_DRIFT",
  "REQUIRED_PARAMETER_UNAVAILABLE"
] as const;
export type S12PreflightFailureCode = (typeof S12_PREFLIGHT_FAILURES)[number];

export interface OpenRouterModelMetadata {
  readonly id: string;
  readonly pricing: { readonly prompt: string; readonly completion: string };
  readonly supportedParameters: readonly string[];
}

export interface OpenRouterEndpointMetadata {
  readonly name: string;
  readonly modelId: string;
  readonly providerName: string;
  readonly tag: string;
  readonly pricing: { readonly prompt: string; readonly completion: string };
  readonly supportedParameters: readonly string[];
}

export interface OpenRouterPreflightResult {
  readonly ok: boolean;
  readonly freeStatusAtExecution: "VERIFIED_ZERO_PRICE" | "NOT_VERIFIED";
  readonly model?: OpenRouterModelMetadata | undefined;
  readonly endpoint?: OpenRouterEndpointMetadata | undefined;
  readonly failure?:
    | { readonly code: S12PreflightFailureCode; readonly detail: string }
    | undefined;
}

export function verifyOpenRouterPreflight(
  model: OpenRouterModelMetadata | undefined,
  endpoints: readonly OpenRouterEndpointMetadata[]
): OpenRouterPreflightResult {
  if (!model || model.id !== S12_SUBJECT.modelId)
    return failure("SUBJECT_IDENTITY_DRIFT", "The exact frozen OpenRouter model is unavailable.");
  if (Number(model.pricing.prompt) !== 0 || Number(model.pricing.completion) !== 0)
    return failure(
      "FREE_TIER_UNAVAILABLE",
      "The model catalog no longer reports zero token prices."
    );
  if (endpoints.length !== 1)
    return failure("PROVIDER_ROUTE_DRIFT", "Exactly one compatible upstream endpoint is required.");
  const endpoint = endpoints[0]!;
  if (
    endpoint.modelId !== S12_SUBJECT.modelId ||
    endpoint.providerName !== S12_SUBJECT.upstreamProvider ||
    endpoint.tag !== S12_SUBJECT.endpointTag ||
    !endpoint.name.includes(S12_SUBJECT.upstreamModelId)
  )
    return failure(
      "PROVIDER_ROUTE_DRIFT",
      "The upstream provider or dated endpoint identity changed."
    );
  if (Number(endpoint.pricing.prompt) !== 0 || Number(endpoint.pricing.completion) !== 0)
    return failure("FREE_TIER_UNAVAILABLE", "The selected endpoint is no longer free.");
  const required = ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"];
  if (required.some((item) => !model.supportedParameters.includes(item)))
    return failure("REQUIRED_PARAMETER_UNAVAILABLE", "The model lost a frozen required parameter.");
  if (required.some((item) => !endpoint.supportedParameters.includes(item)))
    return failure(
      "REQUIRED_PARAMETER_UNAVAILABLE",
      "The endpoint lost a frozen required parameter."
    );
  return { ok: true, freeStatusAtExecution: "VERIFIED_ZERO_PRICE", model, endpoint };
}

const failure = (code: S12PreflightFailureCode, detail: string): OpenRouterPreflightResult => ({
  ok: false,
  freeStatusAtExecution: "NOT_VERIFIED",
  failure: { code, detail }
});

export interface OpenRouterMessage {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
  readonly toolCallId?: string | undefined;
  readonly toolCalls?: readonly OpenRouterToolCall[] | undefined;
}

export interface OpenRouterToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Readonly<Record<string, unknown>>;
}

export interface OpenRouterGenerationResponse {
  readonly responseId: string;
  readonly model: string;
  readonly provider?: string | undefined;
  readonly message: OpenRouterMessage;
  readonly toolCalls: readonly OpenRouterToolCall[];
  readonly usage: {
    readonly inputTokens?: number | undefined;
    readonly outputTokens?: number | undefined;
    readonly reasoningTokens?: number | undefined;
    readonly reportedCostUsd?: number | undefined;
  };
}

export interface OpenRouterTransport {
  listModels(apiKey: string): Promise<readonly OpenRouterModelMetadata[]>;
  listEndpoints(modelId: string, apiKey: string): Promise<readonly OpenRouterEndpointMetadata[]>;
  generate(
    request: Readonly<Record<string, unknown>>,
    apiKey: string,
    signal: AbortSignal
  ): Promise<OpenRouterGenerationResponse>;
}

export class OpenRouterSubjectError extends Error {
  constructor(
    readonly code: S12PreflightFailureCode | "CREDENTIAL_UNAVAILABLE" | "TIMEOUT",
    message: string
  ) {
    super(message);
    this.name = "OpenRouterSubjectError";
  }
}

export class OpenRouterSubjectAdapter {
  constructor(
    private readonly transport: OpenRouterTransport,
    private readonly credentialReader: () => string | undefined = () =>
      process.env["OPENROUTER_API_KEY"]
  ) {}

  async preflight(): Promise<OpenRouterPreflightResult> {
    const apiKey = this.credentialReader();
    if (!apiKey)
      throw new OpenRouterSubjectError("CREDENTIAL_UNAVAILABLE", "Credential unavailable.");
    const models = await this.transport.listModels(apiKey);
    const endpoints = await this.transport.listEndpoints(S12_SUBJECT.modelId, apiKey);
    return verifyOpenRouterPreflight(
      models.find((model) => model.id === S12_SUBJECT.modelId),
      endpoints
    );
  }

  async generateAfterFreshPreflight(
    messages: readonly OpenRouterMessage[],
    timeoutMs = S12_SUBJECT.maxWallTimePerRunMs
  ): Promise<OpenRouterGenerationResponse> {
    const apiKey = this.credentialReader();
    if (!apiKey)
      throw new OpenRouterSubjectError("CREDENTIAL_UNAVAILABLE", "Credential unavailable.");
    const result = verifyOpenRouterPreflight(
      (await this.transport.listModels(apiKey)).find((model) => model.id === S12_SUBJECT.modelId),
      await this.transport.listEndpoints(S12_SUBJECT.modelId, apiKey)
    );
    if (!result.ok) throw new OpenRouterSubjectError(result.failure!.code, result.failure!.detail);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Math.min(timeoutMs, S12_SUBJECT.maxWallTimePerRunMs)
    );
    try {
      return await this.transport.generate(
        {
          model: S12_SUBJECT.modelId,
          messages,
          temperature: S12_SUBJECT_CONFIGURATION.temperature.value,
          top_p: S12_SUBJECT_CONFIGURATION.topP.value,
          max_tokens: S12_SUBJECT_CONFIGURATION.maxOutput.value,
          seed: S12_SUBJECT_CONFIGURATION.seed.value,
          tools: S12_TOOL_DECLARATIONS,
          tool_choice: S12_SUBJECT_CONFIGURATION.toolChoice.value,
          provider: {
            only: [S12_SUBJECT.endpointTag],
            order: [S12_SUBJECT.endpointTag],
            allow_fallbacks: false,
            require_parameters: true,
            max_price: { prompt: 0, completion: 0 }
          }
        },
        apiKey,
        controller.signal
      );
    } catch (error) {
      if (controller.signal.aborted) throw new OpenRouterSubjectError("TIMEOUT", "Run timed out.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export type S12ToolName = "read_file" | "write_file" | "list_files" | "run_command";

export interface S12ToolRequest {
  readonly name: S12ToolName;
  readonly arguments: Readonly<Record<string, unknown>>;
}

export interface ValidatedToolRequest extends S12ToolRequest {
  readonly resolvedPath?: string | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface S12ToolOperations {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path: string): Promise<readonly string[]>;
  runCommand(
    workspaceRoot: string,
    command: string,
    timeoutMs: number
  ): Promise<{ readonly exitCode: number; readonly stdout: string; readonly stderr: string }>;
}

export interface S12ToolExecutionResult {
  readonly result: Readonly<Record<string, unknown>>;
  readonly exitStatus: number | "NOT_APPLICABLE";
  readonly provenance: readonly string[];
}

const FORBIDDEN_PATH_SEGMENTS = [".git", "node_modules", "verifier", "evidence"];
const ALLOWED_COMMANDS = new Set([
  "pnpm build",
  "pnpm typecheck",
  "pnpm test",
  "pnpm verify",
  "node dist/cli.js"
]);

export class S12ToolPolicyError extends Error {
  constructor(
    readonly code: "PATH_ESCAPE" | "FORBIDDEN_PATH" | "FORBIDDEN_COMMAND" | "INVALID_TOOL"
  ) {
    super(code);
    this.name = "S12ToolPolicyError";
  }
}

export function validateToolRequest(
  workspaceRoot: string,
  request: S12ToolRequest
): ValidatedToolRequest {
  if (request.name === "run_command") {
    const command = String(request.arguments["command"] ?? "");
    const timeoutMs = Number(request.arguments["timeoutMs"] ?? 60_000);
    if (!ALLOWED_COMMANDS.has(command)) throw new S12ToolPolicyError("FORBIDDEN_COMMAND");
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 10 * 60_000)
      throw new S12ToolPolicyError("INVALID_TOOL");
    return { ...request, timeoutMs };
  }
  const supplied = String(request.arguments["path"] ?? "");
  const root = path.resolve(workspaceRoot);
  const resolved = path.resolve(root, supplied);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new S12ToolPolicyError("PATH_ESCAPE");
  const segments = relative.split(path.sep).map((item) => item.toLowerCase());
  if (segments.some((item) => FORBIDDEN_PATH_SEGMENTS.includes(item)))
    throw new S12ToolPolicyError("FORBIDDEN_PATH");
  return { ...request, resolvedPath: resolved };
}

export class S12LocalToolExecutor {
  constructor(private readonly operations: S12ToolOperations) {}

  async execute(workspaceRoot: string, request: S12ToolRequest): Promise<S12ToolExecutionResult> {
    const validated = validateToolRequest(workspaceRoot, request);
    if (validated.name === "run_command") {
      const command = String(validated.arguments["command"]);
      const output = await this.operations.runCommand(workspaceRoot, command, validated.timeoutMs!);
      return {
        result: {
          stdoutDigest: digestHex(output.stdout),
          stderrDigest: digestHex(output.stderr)
        },
        exitStatus: output.exitCode,
        provenance: ["s12-controlled-command@0.1.0"]
      };
    }

    const resolvedPath = validated.resolvedPath!;
    if (validated.name === "read_file") {
      const content = await this.operations.readFile(resolvedPath);
      return {
        result: { content, contentDigest: digestHex(content) },
        exitStatus: "NOT_APPLICABLE",
        provenance: ["s12-controlled-filesystem@0.1.0"]
      };
    }
    if (validated.name === "list_files") {
      const files = [...(await this.operations.listFiles(resolvedPath))].sort();
      return {
        result: { files, listingDigest: digestHex(files) },
        exitStatus: "NOT_APPLICABLE",
        provenance: ["s12-controlled-filesystem@0.1.0"]
      };
    }

    const content = validated.arguments["content"];
    if (typeof content !== "string") throw new S12ToolPolicyError("INVALID_TOOL");
    await this.operations.writeFile(resolvedPath, content);
    return {
      result: { contentDigest: digestHex(content) },
      exitStatus: "NOT_APPLICABLE",
      provenance: ["s12-controlled-filesystem@0.1.0"]
    };
  }
}

export async function runOpenRouterToolLoop(
  adapter: OpenRouterSubjectAdapter,
  executor: S12LocalToolExecutor,
  workspaceRoot: string,
  initialMessages: readonly OpenRouterMessage[]
): Promise<{ readonly messages: readonly OpenRouterMessage[]; readonly attempts: number }> {
  const messages = [...initialMessages];
  for (let attempt = 1; attempt <= S12_SUBJECT.maxAttempts; attempt++) {
    const response = await adapter.generateAfterFreshPreflight(messages);
    messages.push({ ...response.message, toolCalls: response.toolCalls });
    if (response.toolCalls.length === 0) return { messages, attempts: attempt };
    for (const call of response.toolCalls) {
      if (!S12_TOOL_DECLARATIONS.some((declaration) => declaration.name === call.name))
        throw new S12ToolPolicyError("INVALID_TOOL");
      const execution = await executor.execute(workspaceRoot, {
        name: call.name as S12ToolName,
        arguments: call.arguments
      });
      messages.push({
        role: "tool",
        toolCallId: call.id,
        content: canonicalJson(execution)
      });
    }
  }
  throw new OpenRouterSubjectError("TIMEOUT", "Maximum attempts reached before completion.");
}

export type S12TerminalStatus = "SUCCEEDED" | "FAILED" | "TIMED_OUT" | "PREFLIGHT_BLOCKED";

export interface S12CapturedToolCall {
  readonly callId: string;
  readonly sequence: number;
  readonly requestedAt: string;
  readonly completedAt: string;
  readonly name: S12ToolName;
  readonly arguments: Readonly<Record<string, unknown>>;
  readonly result: Readonly<Record<string, unknown>>;
  readonly durationMs: number;
  readonly exitStatus: number | "NOT_APPLICABLE" | "TIMED_OUT";
  readonly provenance: readonly string[];
}

export interface S12ExecutionCapture {
  readonly runId: string;
  readonly attemptId: string;
  readonly utcTimestamp: string;
  readonly subjectId: typeof S12_SUBJECT.subjectId;
  readonly modelId: typeof S12_SUBJECT.modelId;
  readonly upstreamModel: typeof S12_SUBJECT.upstreamModelId;
  readonly upstreamProvider: typeof S12_SUBJECT.upstreamProvider;
  readonly configDigest: string;
  readonly fixtureDigest: string;
  readonly environmentDigest: string;
  readonly modelTurns: readonly {
    readonly sequence: number;
    readonly role: OpenRouterMessage["role"];
    readonly contentDigest: string;
  }[];
  readonly toolCalls: readonly S12CapturedToolCall[];
  readonly artifactMutations: readonly {
    readonly sequence: number;
    readonly path: string;
    readonly operation: "CREATE" | "UPDATE" | "DELETE";
    readonly contentDigest?: string | undefined;
  }[];
  readonly terminalStatus: S12TerminalStatus;
  readonly structuredFailure?: { readonly code: string; readonly detail: string } | undefined;
  readonly usage: {
    readonly inputTokens?: number | undefined;
    readonly outputTokens?: number | undefined;
    readonly reasoningTokens?: number | undefined;
    readonly accounting: "PROVIDER_REPORTED" | "UNAVAILABLE";
    readonly reportedCostUsd?: number | undefined;
  };
  readonly freeStatusAtExecution: "VERIFIED_ZERO_PRICE" | "NOT_VERIFIED";
  readonly retryLineage: readonly string[];
  readonly missingness: readonly string[];
  readonly scientificAuthority: typeof S12_FEASIBILITY_AUTHORITY;
}

export function executionCaptureDigest(capture: S12ExecutionCapture): string {
  return digestHex(capture);
}

export function mapCaptureToBehavioralTrace(
  capture: S12ExecutionCapture
): readonly BehavioralTraceEvent[] {
  const raw = [
    ...capture.modelTurns.map((turn) => ({
      sequence: turn.sequence,
      timestamp: capture.utcTimestamp,
      stage: "CONTEXT" as const,
      actionType: `MODEL_${turn.role.toUpperCase()}`,
      payload: { contentDigest: turn.contentDigest, attemptId: capture.attemptId }
    })),
    ...capture.toolCalls.map((call) => ({
      sequence: call.sequence,
      timestamp: call.completedAt,
      stage: (call.exitStatus === 0 || call.exitStatus === "NOT_APPLICABLE"
        ? "RESULT"
        : "RECOVERY") as "RESULT" | "RECOVERY",
      actionType: call.name,
      payload: {
        arguments: call.arguments,
        result: call.result,
        durationMs: call.durationMs,
        exitCode: call.exitStatus
      }
    })),
    ...capture.artifactMutations.map((mutation) => ({
      sequence: mutation.sequence,
      timestamp: capture.utcTimestamp,
      stage: "ACTION" as const,
      actionType: `ARTIFACT_${mutation.operation}`,
      payload: { path: mutation.path, contentDigest: mutation.contentDigest }
    }))
  ].sort((left, right) => left.sequence - right.sequence);

  let previousEventHash: string | undefined;
  return raw.map((entry, index) => {
    const payloadDigest = digestHex(entry.payload);
    const event: BehavioralTraceEvent = {
      eventId: `${capture.runId}:${index + 1}`,
      seq: index + 1,
      stage: entry.stage,
      timestamp: entry.timestamp,
      agentId: capture.subjectId,
      actionType: entry.actionType,
      payload: entry.payload,
      payloadDigest,
      ...(previousEventHash ? { previousEventHash } : {}),
      stepIndex: index
    };
    previousEventHash = digestHex(event);
    return event;
  });
}

export const S12_MILESTONES = [
  { id: "M1", critical: true, label: "Schema" },
  { id: "M2", critical: true, label: "Migration" },
  { id: "M3", critical: true, label: "Preservation" },
  { id: "M4", critical: true, label: "CLI" },
  { id: "M5", critical: true, label: "Integration" },
  { id: "M6", critical: false, label: "Documentation" }
] as const;

export type S12MilestoneOutcome = "SATISFIED" | "NOT_SATISFIED" | "UNVERIFIABLE";

export interface FinalRepositorySnapshot {
  readonly files: Readonly<Record<string, string>>;
  readonly checks: Readonly<
    Record<string, { readonly exitCode: number; readonly outputDigest: string }>
  >;
}

export interface S12VerificationResult {
  readonly milestones: readonly {
    readonly milestoneId: string;
    readonly critical: boolean;
    readonly outcome: S12MilestoneOutcome;
    readonly evidence: readonly string[];
  }[];
  readonly criterion: "SATISFIED" | "NOT_SATISFIED" | "UNVERIFIABLE";
  readonly verifierAuthority: typeof S12_EVIDENCE_AUTHORITY;
  readonly scientificAuthority: typeof S12_FEASIBILITY_AUTHORITY;
}

export class S12IndependentVerifier {
  verify(snapshot: FinalRepositorySnapshot): S12VerificationResult {
    const file = (name: string) => snapshot.files[name];
    const check = (name: string) => snapshot.checks[name];
    const evaluate = (requirements: readonly (string | undefined)[]): S12MilestoneOutcome =>
      requirements.some((value) => value === undefined)
        ? "UNVERIFIABLE"
        : requirements.every((value) => value === "0" || value === "present")
          ? "SATISFIED"
          : "NOT_SATISFIED";
    const outcomes = [
      result(
        "M1",
        true,
        evaluate([
          file("src/schema-v2.ts") ? "present" : "failed",
          check("schema")?.exitCode.toString()
        ]),
        ["src/schema-v2.ts", "check:schema"]
      ),
      result(
        "M2",
        true,
        evaluate([
          file("src/migrate.ts") ? "present" : "failed",
          check("migration")?.exitCode.toString()
        ]),
        ["src/migrate.ts", "check:migration"]
      ),
      result(
        "M3",
        true,
        evaluate([
          check("preservation")?.exitCode.toString(),
          check("immutability")?.exitCode.toString()
        ]),
        ["check:preservation", "check:immutability"]
      ),
      result(
        "M4",
        true,
        evaluate([file("src/cli.ts") ? "present" : "failed", check("cli")?.exitCode.toString()]),
        ["src/cli.ts", "check:cli"]
      ),
      result(
        "M5",
        true,
        evaluate([
          check("build")?.exitCode.toString(),
          check("typecheck")?.exitCode.toString(),
          check("verifier")?.exitCode.toString()
        ]),
        ["check:build", "check:typecheck", "check:verifier"]
      ),
      result(
        "M6",
        false,
        evaluate([
          file("README.md") ? "present" : "failed",
          check("documentation")?.exitCode.toString()
        ]),
        ["README.md", "check:documentation"]
      )
    ];
    const critical = outcomes.filter((item) => item.critical);
    const criterion = critical.some((item) => item.outcome === "UNVERIFIABLE")
      ? "UNVERIFIABLE"
      : critical.every((item) => item.outcome === "SATISFIED")
        ? "SATISFIED"
        : "NOT_SATISFIED";
    return {
      milestones: outcomes,
      criterion,
      verifierAuthority: S12_EVIDENCE_AUTHORITY,
      scientificAuthority: S12_FEASIBILITY_AUTHORITY
    };
  }
}

const result = (
  milestoneId: string,
  critical: boolean,
  outcome: S12MilestoneOutcome,
  evidence: readonly string[]
): S12VerificationResult["milestones"][number] => ({
  milestoneId,
  critical,
  outcome,
  evidence
});

export interface S12ReliabilityMapping {
  readonly current: EvidenceRecordReference;
  readonly futureMethods: readonly ["NUMERIC_RUN_TO_RUN_STABILITY", "STOCHASTIC_STABILITY"];
  readonly scientificAuthority: typeof S12_FEASIBILITY_AUTHORITY;
}

export function mapExactRepeatabilityToS05(
  captureDigests: readonly string[],
  evidenceReferences: readonly string[]
): S12ReliabilityMapping {
  const ordered = [...captureDigests].sort();
  const material = {
    study: "s12_long_horizon_exact_repeatability@0.1.0",
    method: "EXACT_REPEATABILITY",
    captureDigests: ordered,
    exactMatches:
      ordered.length <= 1 ? 0 : ordered.every((value) => value === ordered[0]) ? ordered.length : 0,
    scientificAuthority: S12_FEASIBILITY_AUTHORITY
  };
  return {
    current: {
      referenceId: "reliability:s12_long_horizon_exact_repeatability@0.1.0",
      scope: "RELIABILITY_S05",
      recordId: "s12_long_horizon_exact_repeatability",
      recordVersion: "0.1.0",
      semanticDigest: semanticDigest(material),
      availability: "AVAILABLE",
      provenanceReferences: [...new Set(evidenceReferences)].sort()
    },
    futureMethods: ["NUMERIC_RUN_TO_RUN_STABILITY", "STOCHASTIC_STABILITY"],
    scientificAuthority: S12_FEASIBILITY_AUTHORITY
  };
}

export function packageS12Evidence(
  system: EvidenceSystem,
  input: Omit<EvidencePackageInput, "scientificAuthority" | "signatureStatus"> & {
    readonly executionManifest: ExecutionManifest;
    readonly artifacts: readonly ArtifactReference[];
  }
): EvidencePackage {
  return system.createEvidencePackage({
    ...input,
    signatureStatus: "NOT_IMPLEMENTED",
    scientificAuthority: S12_FEASIBILITY_AUTHORITY
  });
}

export interface S12FixtureIdentityInput {
  readonly scenarioId: "s12_lh_config_migration_feasibility";
  readonly scenarioVersion: "0.1.0";
  readonly canonicalManifest: unknown;
  readonly startingTree: Readonly<Record<string, string>>;
  readonly taskInstruction: string;
  readonly verifierMaterial: unknown;
}

export function computeS12FixtureIdentity(input: S12FixtureIdentityInput) {
  return {
    scenarioId: input.scenarioId,
    scenarioVersion: input.scenarioVersion,
    canonicalManifestDigest: digestHex(input.canonicalManifest),
    startingTreeDigest: digestHex(input.startingTree),
    taskInstructionDigest: digestHex(input.taskInstruction),
    verifierDigest: digestHex(input.verifierMaterial),
    fixtureDigest: digestHex(input)
  } as const;
}
