import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { S12CommandDiagnosticSidecarBuilder } from "./s12-command-diagnostic-sidecar.js";
import {
  S12_EXECUTION_STRATA,
  s12ProspectiveConfigDigest,
  validateS12ExecutionContract,
  type S12ExecutionContract,
  S12_SUBJECT,
  OpenRouterSubjectAdapter,
  OpenRouterSubjectError,
  S12LocalToolExecutor,
  S12ToolInstrumentationError,
  S12AttemptDeadlineExceeded,
  S12ToolPolicyError,
  recoverableToolError,
  validateToolRequest,
  type OpenRouterMessage,
  type OpenRouterPreflightResult,
  type S12ToolName
} from "./s12-openrouter-feasibility.js";

export type S12QualificationMode = "DRY_RUN" | "LIVE_QUALIFICATION";
export type S12QualificationTerminal =
  | "COMPLETED"
  | "SUBJECT_TASK_FAILURE"
  | "INSTRUMENTATION_FAILURE"
  | "VERIFIER_FAILURE"
  | "PREFLIGHT_BLOCKED"
  | "RESOURCE_LIMIT"
  | "TIMEOUT";

export interface S12OrderedCaptureEvent {
  readonly sequence: number;
  readonly timestamp: string;
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface S12QualificationHooks {
  verifyFinalState(): Promise<unknown>;
  evaluate(capture: readonly S12OrderedCaptureEvent[]): Promise<unknown>;
  packageEvidence(input: Readonly<Record<string, unknown>>): Promise<unknown>;
}

export interface S12QualificationResult {
  readonly mode: S12QualificationMode;
  readonly runId?: string | undefined;
  readonly attemptId?: string | undefined;
  readonly modelRequestCount: number;
  readonly terminalStatus: S12QualificationTerminal;
  readonly events: readonly S12OrderedCaptureEvent[];
  readonly verification?: unknown;
  readonly evaluation?: unknown;
  readonly evidence?: unknown;
  readonly structuredFailure?: { readonly code: string; readonly detail: string } | undefined;
  readonly configDigest: string;
  readonly scientificAuthority: "NONE";
}

export class S12QualificationRunner {
  constructor(
    private readonly adapter: OpenRouterSubjectAdapter,
    private readonly executor: S12LocalToolExecutor,
    private readonly hooks: S12QualificationHooks,
    private readonly clock: () => string = () => new Date().toISOString(),
    private readonly idFactory: () => string = () => crypto.randomUUID(),
    private readonly executionContract: S12ExecutionContract = S12_EXECUTION_STRATA.S12_10_TURNS,
    private readonly monotonicNow: () => number = () => performance.now(),
    private readonly commandDiagnosticSidecar?: S12CommandDiagnosticSidecarBuilder
  ) {}

  async run(input: {
    readonly mode?: S12QualificationMode;
    readonly liveAuthorized?: boolean;
    readonly workspaceRoot: string;
    readonly fixtureDigest: string;
    readonly messages: readonly OpenRouterMessage[];
  }): Promise<S12QualificationResult> {
    const contract = validateS12ExecutionContract(this.executionContract);
    const configDigest = s12ProspectiveConfigDigest(contract);
    const mode = input.mode ?? "DRY_RUN";
    if (mode === "LIVE_QUALIFICATION" && input.liveAuthorized !== true)
      return this.failure(
        mode,
        [],
        0,
        "INSTRUMENTATION_FAILURE",
        "LIVE_AUTHORIZATION_REQUIRED",
        "Live mode requires explicit authorization."
      );

    const events: S12OrderedCaptureEvent[] = [];
    const append = (type: string, payload: Readonly<Record<string, unknown>>) =>
      events.push({ sequence: events.length + 1, timestamp: this.clock(), type, payload });
    append("EXECUTION_START", {
      mode,
      subjectId: S12_SUBJECT.subjectId,
      fixtureDigest: input.fixtureDigest,
      configDigest,
      executionContract: contract
    });

    let preflight;
    try {
      preflight = await this.adapter.preflight();
    } catch (error) {
      return this.failure(mode, events, 0, "PREFLIGHT_BLOCKED", code(error), safeDetail(error));
    }
    const initialPreflight = preflightEvidence(preflight, this.clock());
    append("PREFLIGHT_RESULT", {
      ...initialPreflight,
      preflightDigest: computeSha256(canonicalJson(initialPreflight))
    });
    if (!preflight.ok)
      return this.failure(
        mode,
        events,
        0,
        "PREFLIGHT_BLOCKED",
        preflight.failure!.code,
        preflight.failure!.detail
      );

    const attemptStartedAt = this.monotonicNow();
    const attemptDeadline = attemptStartedAt + contract.maxAttemptWallTimeMs;
    const remainingAttemptMs = () => {
      const remaining = attemptDeadline - this.monotonicNow();
      if (!Number.isFinite(remaining) || remaining <= 0) throw new S12AttemptDeadlineExceeded();
      return remaining;
    };
    const runId = `${mode === "DRY_RUN" ? "dry-run" : "run"}:${this.idFactory()}`;
    const attemptId = `${mode === "DRY_RUN" ? "dry-attempt" : "attempt"}:${this.idFactory()}`;
    append("ATTEMPT_CREATED", { runId, attemptId, subjectAttempt: 1 });
    const messages = [...input.messages];
    let modelRequestCount = 0;
    try {
      for (let turn = 1; turn <= contract.maxModelTurns; turn++) {
        remainingAttemptMs();
        const modelRequestId = `model-request:${turn}`;
        const response = await this.adapter.generateAfterFreshPreflight(
          messages,
          contract.maxAttemptWallTimeMs,
          {
            preflightPassed: (result) => {
              const evidence = preflightEvidence(result, this.clock());
              append("TURN_PREFLIGHT_PASSED", {
                modelRequestId,
                ...evidence,
                preflightDigest: computeSha256(canonicalJson(evidence))
              });
            },
            requestPrepared: (evidence) =>
              append("REQUEST_PREPARED", { modelRequestId, attemptId, ...evidence }),
            wireRequestPrepared: (evidence) =>
              append("WIRE_REQUEST_PREPARED", { modelRequestId, attemptId, ...evidence }),
            operationTimeoutMs: (configuredTimeoutMs) =>
              Math.min(configuredTimeoutMs, remainingAttemptMs()),
            attemptDeadlineReached: () => this.monotonicNow() >= attemptDeadline,
            generationInvoked: (effectiveTimeoutMs) => {
              modelRequestCount++;
              append("GENERATION_INVOKED", {
                modelRequestId,
                attemptId,
                requestedModelId: S12_SUBJECT.modelId,
                effectiveTimeoutMs
              });
            }
          }
        );
        remainingAttemptMs();
        append("MODEL_RESPONSE", {
          modelRequestId,
          responseId: response.responseId,
          model: response.model,
          provider: response.provider ?? "UNKNOWN",
          contentDigest: computeSha256(response.message.content),
          usage: response.usage
        });
        messages.push({ ...response.message, toolCalls: response.toolCalls });
        if (response.toolCalls.length === 0) {
          append("SUBJECT_TERMINATED", { reason: "MODEL_COMPLETION" });
          const verification = await this.hooks.verifyFinalState();
          append("VERIFIER_RESULT", { digest: computeSha256(canonicalJson(verification)) });
          if (isUnverifiable(verification)) {
            append("STRUCTURED_FAILURE", {
              code: "VERIFIER_FAILURE",
              detail: "Authoritative verifier returned UNVERIFIABLE."
            });
            return {
              mode,
              runId,
              attemptId,
              modelRequestCount,
              terminalStatus: "VERIFIER_FAILURE",
              events,
              verification,
              structuredFailure: {
                code: "VERIFIER_FAILURE",
                detail: "Authoritative verifier returned UNVERIFIABLE."
              },
              configDigest,
              scientificAuthority: "NONE"
            };
          }
          const evaluation = await this.hooks.evaluate(events);
          append("EVALUATION_RESULT", { digest: computeSha256(canonicalJson(evaluation)) });
          const evidence = await this.hooks.packageEvidence({
            runId,
            attemptId,
            verification,
            evaluation,
            events
          });
          append("EVIDENCE_RESULT", { digest: computeSha256(canonicalJson(evidence)) });
          return {
            mode,
            runId,
            attemptId,
            modelRequestCount,
            terminalStatus: "COMPLETED",
            events,
            verification,
            evaluation,
            evidence,
            configDigest,
            scientificAuthority: "NONE"
          };
        }
        for (const call of response.toolCalls) {
          remainingAttemptMs();
          append("TOOL_REQUESTED", {
            callId: call.id,
            name: isToolName(call.name) ? call.name : "UNKNOWN_TOOL",
            ...capturedToolArguments(input.workspaceRoot, call)
          });
          if (!isToolName(call.name)) throw new S12ToolPolicyError("INVALID_TOOL");
          const toolRequest = { name: call.name, arguments: call.arguments } as const;
          try {
            validateToolRequest(input.workspaceRoot, toolRequest);
          } catch (error) {
            const rejected = recoverableToolError(error);
            if (!rejected) throw error;
            append("TOOL_VALIDATION", { callId: call.id, accepted: false, error: rejected.error });
            append("TOOL_EXECUTION_RESULT", {
              callId: call.id,
              durationMs: 0,
              status: rejected.status,
              exitStatus: rejected.exitStatus,
              result: rejected.result,
              error: rejected.error,
              provenance: rejected.provenance
            });
            messages.push({
              role: "tool",
              toolCallId: call.id,
              content: canonicalJson({ toolCallId: call.id, tool: call.name, ...rejected })
            });
            append("MODEL_CONTINUATION", { callId: call.id });
            continue;
          }
          append("TOOL_VALIDATION", { callId: call.id, accepted: true });
          remainingAttemptMs();
          const started = Date.now();
          append("TOOL_EXECUTION_STARTED", { callId: call.id });
          let result;
          try {
            result = await this.executor.execute(
              input.workspaceRoot,
              toolRequest,
              remainingAttemptMs,
              { runId, attemptId, toolCallId: call.id }
            );
          } catch (error) {
            if (error instanceof S12AttemptDeadlineExceeded) {
              if (call.name === "run_command")
                this.commandDiagnosticSidecar?.recordUnavailable({
                  runId,
                  attemptId,
                  toolCallId: call.id
                });
              throw error;
            }
            const failure =
              error instanceof S12ToolInstrumentationError
                ? error
                : new S12ToolInstrumentationError(
                    "TOOL_RUNTIME_INTERNAL_ERROR",
                    "The controlled tool runtime failed unexpectedly."
                  );
            if (call.name === "run_command")
              this.commandDiagnosticSidecar?.recordUnavailable({
                runId,
                attemptId,
                toolCallId: call.id
              });
            append("TOOL_EXECUTION_RESULT", {
              callId: call.id,
              durationMs: Date.now() - started,
              status: "ERROR",
              exitStatus: failure.code === "COMMAND_TIMEOUT" ? "TIMED_OUT" : "NOT_APPLICABLE",
              result: {},
              error: {
                code: failure.code,
                recoverable: false,
                explanation: safeInstrumentationDetail(failure.code),
                ...(failure.diagnostics ? { diagnostics: failure.diagnostics } : {})
              },
              provenance: ["s12-controlled-tool-failure@0.1.0"]
            });
            throw failure;
          }
          append("TOOL_EXECUTION_RESULT", {
            callId: call.id,
            durationMs: Date.now() - started,
            status: result.status,
            exitStatus: result.exitStatus,
            result: result.result,
            ...(result.error ? { error: result.error } : {}),
            provenance: result.provenance
          });
          remainingAttemptMs();
          messages.push({
            role: "tool",
            toolCallId: call.id,
            content: canonicalJson({ toolCallId: call.id, tool: call.name, ...result })
          });
          append("MODEL_CONTINUATION", { callId: call.id });
        }
      }
      append("STRUCTURED_FAILURE", {
        code: "MAX_MODEL_TURNS",
        detail: "Maximum model turns reached."
      });
      return this.failure(
        mode,
        events,
        modelRequestCount,
        "RESOURCE_LIMIT",
        "MAX_MODEL_TURNS",
        "Maximum model turns reached.",
        runId,
        attemptId
      );
    } catch (error) {
      const cumulativeDeadlineExceeded =
        error instanceof S12AttemptDeadlineExceeded ||
        (((error instanceof OpenRouterSubjectError && error.code === "TIMEOUT") ||
          (error instanceof S12ToolInstrumentationError && error.code === "COMMAND_TIMEOUT")) &&
          this.monotonicNow() >= attemptDeadline);
      const failureCode = cumulativeDeadlineExceeded ? "MAX_ATTEMPT_WALL_TIME" : code(error);
      const failureDetail = cumulativeDeadlineExceeded
        ? "The cumulative subject-attempt wall-time limit was reached."
        : safeDetail(error);
      append("STRUCTURED_FAILURE", { code: failureCode, detail: failureDetail });
      return this.failure(
        mode,
        events,
        modelRequestCount,
        cumulativeDeadlineExceeded
          ? "RESOURCE_LIMIT"
          : (error instanceof OpenRouterSubjectError && error.code === "TIMEOUT") ||
              (error instanceof S12ToolInstrumentationError && error.code === "COMMAND_TIMEOUT")
            ? "TIMEOUT"
            : error instanceof S12ToolInstrumentationError &&
                error.code === "COMMAND_RESOURCE_LIMIT"
              ? "RESOURCE_LIMIT"
              : "INSTRUMENTATION_FAILURE",
        failureCode,
        failureDetail,
        runId,
        attemptId
      );
    }
  }

  private failure(
    mode: S12QualificationMode,
    events: readonly S12OrderedCaptureEvent[],
    modelRequestCount: number,
    terminalStatus: S12QualificationTerminal,
    failureCode: string,
    detail: string,
    runId?: string,
    attemptId?: string
  ): S12QualificationResult {
    return {
      mode,
      runId,
      attemptId,
      modelRequestCount,
      terminalStatus,
      events,
      structuredFailure: { code: failureCode, detail },
      configDigest: s12ProspectiveConfigDigest(
        validateS12ExecutionContract(this.executionContract)
      ),
      scientificAuthority: "NONE"
    };
  }
}

function preflightEvidence(result: OpenRouterPreflightResult, metadataObservedAt: string) {
  const model = result.model;
  const endpoint = result.endpoint;
  const required = ["tools", "tool_choice", "temperature", "top_p", "max_tokens", "seed"];
  return {
    ok: result.ok,
    freeStatus: result.freeStatusAtExecution,
    requestedModelId: S12_SUBJECT.modelId,
    observedModelId: model?.id ?? "UNKNOWN",
    expectedUpstreamModelId: S12_SUBJECT.upstreamModelId,
    observedUpstreamModelId:
      endpoint?.name.includes(S12_SUBJECT.upstreamModelId) === true
        ? S12_SUBJECT.upstreamModelId
        : "UNKNOWN",
    expectedProvider: S12_SUBJECT.upstreamProvider,
    observedProvider: endpoint?.providerName ?? "UNKNOWN",
    expectedEndpointIdentity: `${S12_SUBJECT.upstreamProvider} | ${S12_SUBJECT.upstreamModelId}`,
    observedEndpointIdentity: endpoint?.name ?? "UNKNOWN",
    endpointTag: endpoint?.tag ?? "UNKNOWN",
    inputPrice: endpoint?.pricing.prompt ?? model?.pricing.prompt ?? "UNKNOWN",
    outputPrice: endpoint?.pricing.completion ?? model?.pricing.completion ?? "UNKNOWN",
    toolsSupported: endpoint?.supportedParameters.includes("tools") ?? false,
    toolChoiceSupported: endpoint?.supportedParameters.includes("tool_choice") ?? false,
    requiredParametersStatus:
      model &&
      endpoint &&
      required.every((value) => model.supportedParameters.includes(value)) &&
      required.every((value) => endpoint.supportedParameters.includes(value))
        ? "SUPPORTED"
        : "UNAVAILABLE",
    fallbackPolicy: { model: "NONE", provider: "NONE", allowFallbacks: false },
    metadataObservedAt
  } as const;
}

function capturedToolArguments(
  workspaceRoot: string,
  call: { readonly name: string; readonly arguments: Readonly<Record<string, unknown>> }
) {
  let argumentsForCapture: Record<string, unknown> = { redacted: true };
  let argumentCapture = "INVALID_REDACTED";
  if (isToolName(call.name)) {
    try {
      const validated = validateToolRequest(workspaceRoot, {
        name: call.name,
        arguments: call.arguments
      });
      if (validated.name === "run_command") {
        argumentsForCapture = {
          command: validated.arguments["command"],
          timeoutMs: validated.timeoutMs
        };
      } else {
        argumentsForCapture = {
          path: path
            .relative(path.resolve(workspaceRoot), validated.resolvedPath!)
            .split(path.sep)
            .join("/")
        };
        if (validated.name === "write_file") {
          const content = validated.arguments["content"];
          if (typeof content !== "string") throw new S12ToolPolicyError("INVALID_TOOL");
          argumentsForCapture["contentDigest"] = computeSha256(content);
        }
      }
      argumentCapture = "VALIDATED_REDACTED";
    } catch {
      // The following TOOL_VALIDATION event records a safe rejection code.
    }
  }
  return {
    arguments: argumentsForCapture,
    argumentCapture,
    argumentDigest: computeSha256(canonicalJson(argumentsForCapture))
  };
}

function isToolName(value: string): value is S12ToolName {
  return ["read_file", "write_file", "list_files", "run_command"].includes(value);
}
function code(error: unknown): string {
  return error instanceof OpenRouterSubjectError ||
    error instanceof S12ToolPolicyError ||
    error instanceof S12ToolInstrumentationError
    ? error.code
    : error instanceof Error
      ? error.name
      : "UNKNOWN";
}
function safeDetail(error: unknown): string {
  return error instanceof S12ToolInstrumentationError
    ? safeInstrumentationDetail(error.code)
    : error instanceof OpenRouterSubjectError
      ? error.message
      : "Unexpected controlled runtime failure.";
}
function safeInstrumentationDetail(code: S12ToolInstrumentationError["code"]): string {
  return {
    COMMAND_TIMEOUT: "The controlled command exceeded its execution bound.",
    COMMAND_RESOURCE_LIMIT: "The controlled command exceeded an execution resource bound.",
    COMMAND_PROCESS_FAILURE: "The controlled command process could not start.",
    TOOL_RUNTIME_INTERNAL_ERROR: "The controlled tool runtime failed unexpectedly.",
    UNEXPECTED_IO_FAILURE: "The controlled filesystem failed unexpectedly."
  }[code];
}
function isUnverifiable(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as Record<string, unknown>)["criterion"] === "UNVERIFIABLE"
  );
}
