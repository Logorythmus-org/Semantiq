import { SemanticCoreLocalTransport } from "./semantic-core-local-transport.js";
import {
  parseSemanticCoreLocalContent,
  semanticCoreLocalWireRequest,
  SEMANTIC_CORE_LOCAL_REQUEST_CONDITION as condition
} from "./semantic-core-local-response.js";
import { validateSemanticCoreResponse } from "./semantic-core.js";
import type { SemanticCoreInput } from "./semantic-core-types.js";
import type {
  SemanticCoreSubjectObservation,
  QualificationFailure
} from "./semantic-core-qualification-types.js";

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export interface SemanticCoreLocalTransportEvidence {
  stages: string[];
  httpStatus: number | null;
  returnedModel: string | null;
  returnedProvider: string | null;
  usage: { promptTokens: number; completionTokens: number; cost: number } | null;
  embeddedProviderError: boolean;
  error: QualificationFailure | null;
  contentEvidence: ReturnType<typeof parseSemanticCoreLocalContent> | null;
}
/** Reconstruct the subject classification from retained bounded transport evidence. */
export function semanticCoreLocalObservationFromTransport(
  evidence: SemanticCoreLocalTransportEvidence
): SemanticCoreSubjectObservation {
  let error: QualificationFailure | null = null;
  if (
    evidence.stages.length === 0 ||
    (evidence.httpStatus === null && evidence.error === "CREDENTIAL_UNAVAILABLE")
  )
    error = evidence.error;
  else if (evidence.httpStatus === null) error = "TRANSPORT_FAILURE";
  else if (
    evidence.httpStatus !== 200 ||
    evidence.embeddedProviderError ||
    !evidence.contentEvidence
  )
    error = "PROVIDER_REJECTION";
  else if (
    ![condition.model as string, condition.canonicalSlug as string].includes(
      evidence.returnedModel ?? ""
    ) ||
    evidence.returnedProvider !== condition.providerName
  )
    error = "IDENTITY_SUBSTITUTION";
  else if (evidence.usage?.cost !== 0) error = "ZERO_COST_POLICY_FAILURE";
  if (error) return { status: "ERROR", error, rawResponseAvailability: "UNAVAILABLE" };
  const local = evidence.contentEvidence;
  if (!local) throw new Error("TRANSPORT_EVIDENCE_INVALID");
  return {
    status: local.state,
    ...(local.state === "RESPONSE" && validateSemanticCoreResponse(local.response)
      ? { response: local.response }
      : {}),
    modelId: condition.model,
    providerName: condition.providerName,
    rawResponseAvailability: "UNAVAILABLE",
    ...(local.contentSha256 ? { rawResponseDigest: local.contentSha256 } : {}),
    ...(evidence.usage ? { usage: evidence.usage } : {})
  };
}

/** Bounded projection only: never retain raw HTTP payloads, reasoning, headers or credentials. */
export async function observeSemanticCoreLocal(
  transport: SemanticCoreLocalTransport,
  input: SemanticCoreInput,
  onPostStart?: () => void
) {
  const stages = ["GENERATION_REQUEST_PREPARED"];
  let httpStatus: number | null = null;
  let returnedModel: string | null = null;
  let returnedProvider: string | null = null;
  let usage: { promptTokens: number; completionTokens: number; cost: number } | null = null;
  let embeddedProviderError = false;
  let contentEvidence: ReturnType<typeof parseSemanticCoreLocalContent> | null = null;
  let error: QualificationFailure | null = null;
  try {
    const result = await transport.request(
      "/chat/completions",
      semanticCoreLocalWireRequest(input),
      (stage) => {
        stages.push(stage);
        if (stage === "GENERATION_POST_SUBMITTED") onPostStart?.();
      }
    );
    httpStatus = result.httpStatus;
    if (
      result.error &&
      "upstreamProvider" in result.error &&
      result.error.upstreamProvider === condition.providerName
    )
      returnedProvider = condition.providerName;
    if (result.error || !result.data)
      error = httpStatus === null ? "TRANSPORT_FAILURE" : "PROVIDER_REJECTION";
    else {
      const data = result.data;
      const choice = object(
        Array.isArray(data.choices) && data.choices.length === 1 ? data.choices[0] : null
      );
      const message = object(choice.message);
      const rawUsage = object(data.usage);
      returnedModel =
        data.model === condition.model || data.model === condition.canonicalSlug
          ? String(data.model)
          : null;
      returnedProvider = data.provider === condition.providerName ? condition.providerName : null;
      embeddedProviderError =
        Object.hasOwn(data, "error") ||
        Object.hasOwn(choice, "error") ||
        choice.finish_reason === "error";
      if (
        [rawUsage.prompt_tokens, rawUsage.completion_tokens].every(
          (value) => Number.isSafeInteger(value) && Number(value) >= 0
        ) &&
        typeof rawUsage.cost === "number" &&
        Number.isFinite(rawUsage.cost) &&
        rawUsage.cost >= 0
      )
        usage = {
          promptTokens: Number(rawUsage.prompt_tokens),
          completionTokens: Number(rawUsage.completion_tokens),
          cost: rawUsage.cost
        };
      // No reasoning/reasoning_details/tool_calls or other provider fields enter evidence.
      contentEvidence = parseSemanticCoreLocalContent(message.content, input);
      if (embeddedProviderError || httpStatus !== 200) error = "PROVIDER_REJECTION";
      else if (!returnedModel || !returnedProvider) error = "IDENTITY_SUBSTITUTION";
      else if (usage?.cost !== 0) error = "ZERO_COST_POLICY_FAILURE";
    }
  } catch (failure) {
    error =
      failure instanceof Error && failure.message === "CREDENTIAL_UNAVAILABLE"
        ? "CREDENTIAL_UNAVAILABLE"
        : "TRANSPORT_FAILURE";
  }
  return {
    observation: semanticCoreLocalObservationFromTransport({
      stages,
      httpStatus,
      returnedModel,
      returnedProvider,
      usage,
      embeddedProviderError,
      error,
      contentEvidence
    }),
    transport: {
      stages,
      httpStatus,
      returnedModel,
      returnedProvider,
      usage,
      embeddedProviderError,
      error,
      contentEvidence
    }
  };
}
export type SemanticCoreLocalObserved = Awaited<ReturnType<typeof observeSemanticCoreLocal>>;
