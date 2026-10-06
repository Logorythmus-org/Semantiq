import { createHash } from "node:crypto";
import { semanticCoreDigest, serializeSemanticCorePrompt } from "./semantic-core-openrouter.js";
import { validateSemanticCoreResponse } from "./semantic-core.js";
import type { SemanticCoreInput } from "./semantic-core-types.js";

export const SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL = {
  protocolId: "semantic_core_pilot_bm3_qualification",
  protocolVersion: "0.1.3",
  serializerVersion: "0.1.3",
  parserPolicy: "JSON_PARSE_CANONICAL_SCHEMA_NO_REPAIR",
  responseFormat: "OMITTED",
  runs: 3,
  casesPerRun: 24,
  scheduledAttempts: 72,
  retryPolicy: "NONE",
  collectionPolicy: "MULTI_QUOTA_WINDOW_SAME_SUBJECT_CONDITION",
  minimumFreeRequestsPerRun: 24,
  runAtomicity: "COMPLETE_RUN_PER_QUOTA_WINDOW",
  collectionWindowMaximumHours: 168,
  minimumRequestIntervalMs: 3500,
  isolation: "FRESH_REQUEST_PER_CASE",
  scientificAuthority: "NONE",
  bmMaturityAuthority: "NONE",
  empiricalConditionGate: "CANARY_D_SUCCESS_REQUIRED"
} as const;
export const SEMANTIC_CORE_LOCAL_REQUEST_CONDITION = {
  model: "apodex/apodex-1.1-mini:free",
  canonicalSlug: "apodex/apodex-1.1-mini-20261001",
  providerName: "Novita",
  discoveryEndpointTag: "novita/bf16",
  providerRoutingSelector: "novita",
  routingPolicy: "DOCUMENTED_BASE_SLUG_SINGLE_ELIGIBLE_ENDPOINT_ONLY",
  temperature: 0,
  maxTokens: 4096,
  reasoningConfiguration: "OMITTED",
  responseFormat: "OMITTED",
  allowFallbacks: false
} as const;
const instruction =
  "Return only one JSON object matching the declared response contract. No reasoning. No explanation. No markdown. No surrounding text.";
export function semanticCoreLocalWireRequest(input?: SemanticCoreInput) {
  const messages = input
    ? [{ role: "system", content: instruction }, serializeSemanticCorePrompt(input)[1]!]
    : [
        {
          role: "user",
          content:
            instruction +
            ' Synthetic engineering canary D: the one permitted token is OK. Return only {"token":"OK"}.'
        }
      ];
  return {
    model: SEMANTIC_CORE_LOCAL_REQUEST_CONDITION.model,
    messages,
    temperature: 0,
    max_tokens: 4096,
    stream: false,
    provider: {
      only: ["novita"],
      order: ["novita"],
      allow_fallbacks: false,
      require_parameters: true,
      max_price: { prompt: 0, completion: 0 }
    }
  };
}
export function parseSemanticCoreLocalContent(content: unknown, input?: SemanticCoreInput) {
  const empty = content === null || content === undefined || content === "";
  const text = typeof content === "string" ? content : null;
  const contentSha256 = text === null ? null : createHash("sha256").update(text).digest("hex");
  const contentBytes = text === null ? null : Buffer.byteLength(text, "utf8");
  const codeUnits = text === null ? null : text.length;
  const bounded = text !== null && text.length <= 16384 && Buffer.byteLength(text, "utf8") <= 65536;
  const securityPermits =
    bounded &&
    !/sk-(?:or-v1-)?[A-Za-z0-9_-]{8,}|Authorization\s*[:=]|Bearer\s|-----BEGIN .*PRIVATE KEY|[A-Z]:\\Users\\|\/(?:home|Users)\/|<think>|<analysis>/i.test(
      text
    );
  let parseOutcome = "NOT_ATTEMPTED";
  let schemaOutcome = "NOT_EVALUATED";
  let state: "RESPONSE" | "MISSING" | "MALFORMED" = empty ? "MISSING" : "MALFORMED";
  let response: unknown = null;
  if (!empty && bounded) {
    try {
      const parsed: unknown = JSON.parse(text);
      parseOutcome = "JSON_PARSE_SUCCEEDED";
      const valid = input
        ? validateSemanticCoreResponse(parsed) &&
          parsed.caseId === input.caseId &&
          (parsed.status === "ABSTAIN" ||
            input.options.some((o) => o.optionId === parsed.selectedOptionId))
        : Boolean(
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed) &&
            Object.keys(parsed).length === 1 &&
            (parsed as Record<string, unknown>).token === "OK"
          );
      schemaOutcome = valid
        ? "CANONICAL_SCHEMA_AND_IDENTITY_VALID"
        : "CANONICAL_SCHEMA_OR_IDENTITY_INVALID";
      if (valid) {
        state = "RESPONSE";
        response = parsed;
      }
    } catch {
      parseOutcome = "JSON_PARSE_FAILED";
    }
  }
  return {
    parserPolicy: SEMANTIC_CORE_LOCAL_RESPONSE_PROTOCOL.parserPolicy,
    state,
    parseOutcome,
    schemaOutcome,
    contentSha256,
    contentBytes,
    codeUnits,
    contentRetention: securityPermits
      ? "EXACT_BOUNDED_MESSAGE_CONTENT"
      : text === null
        ? "UNAVAILABLE"
        : "WITHHELD_SECURITY_OR_SIZE_POLICY",
    content: securityPermits ? text : null,
    response: securityPermits ? response : null,
    replayAvailable: securityPermits || empty,
    scientificAuthority: "NONE"
  };
}
export function replaySemanticCoreLocalContent(
  evidence: ReturnType<typeof parseSemanticCoreLocalContent>,
  input?: SemanticCoreInput
) {
  if (!evidence.replayAvailable) throw new Error("CONTENT_REPLAY_UNAVAILABLE");
  const replay = parseSemanticCoreLocalContent(evidence.content, input);
  if (semanticCoreDigest(replay) !== semanticCoreDigest(evidence))
    throw new Error("CONTENT_REPLAY_MISMATCH");
  return replay;
}
export function assertSemanticCoreCanaryDGate(canary: {
  kind?: unknown;
  success?: unknown;
  eligibleForQualification?: unknown;
  replayExact?: unknown;
}) {
  if (
    canary.kind !== "D" ||
    canary.success !== true ||
    canary.eligibleForQualification !== false ||
    canary.replayExact !== true
  )
    throw new Error("CANARY_D_SUCCESS_REQUIRED");
}
