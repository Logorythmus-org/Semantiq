import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import {
  S12_TOOL_DECLARATIONS,
  type OpenRouterEndpointMetadata,
  type OpenRouterGenerationResponse,
  type OpenRouterModelMetadata,
  type OpenRouterTransport
} from "./s12-openrouter-feasibility.js";

export const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export interface ProviderFunctionTool {
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: Readonly<Record<string, unknown>>;
  };
}

const TOOL_SCHEMAS: Record<string, ProviderFunctionTool> = {
  read_file: tool(
    "read_file",
    "Read one UTF-8 file inside the fixture workspace.",
    {
      path: { type: "string", minLength: 1 }
    },
    ["path"]
  ),
  write_file: tool(
    "write_file",
    "Write one UTF-8 file inside the fixture workspace.",
    {
      path: { type: "string", minLength: 1 },
      content: { type: "string" }
    },
    ["path", "content"]
  ),
  list_files: tool(
    "list_files",
    "List a bounded directory inside the fixture workspace.",
    {
      path: { type: "string", minLength: 1 }
    },
    ["path"]
  ),
  run_command: tool(
    "run_command",
    "Run one allowlisted fixture command.",
    {
      command: {
        type: "string",
        enum: ["pnpm build", "pnpm typecheck", "pnpm test", "pnpm verify", "node dist/cli.js"]
      },
      timeoutMs: { type: "integer", minimum: 1, maximum: 600000 }
    },
    ["command"]
  )
};

function tool(
  name: string,
  description: string,
  properties: Readonly<Record<string, unknown>>,
  required: readonly string[]
): ProviderFunctionTool {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: { type: "object", additionalProperties: false, properties, required }
    }
  };
}

export function serializeOpenRouterTools(): readonly ProviderFunctionTool[] {
  return S12_TOOL_DECLARATIONS.map((declaration) => TOOL_SCHEMAS[declaration.name]!);
}

export function canonicalProviderTools(): string {
  return canonicalJson(serializeOpenRouterTools());
}

export function serializeOpenRouterRequestBody(
  request: Readonly<Record<string, unknown>>,
  providerTools: readonly ProviderFunctionTool[] = serializeOpenRouterTools()
): Readonly<Record<string, unknown>> {
  const provider = asRecord(request["provider"]);
  return {
    ...request,
    messages: Array.isArray(request["messages"])
      ? request["messages"].map((value) => serializeMessage(asRecord(value)))
      : [],
    tools: providerTools,
    provider: { ...provider, allow_fallbacks: false, require_parameters: true }
  };
}

export function localWireRequestDigest(body: Readonly<Record<string, unknown>>): string {
  return computeSha256(canonicalJson(body));
}

export interface S12FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

export type S12Fetch = (
  input: string,
  init: Readonly<Record<string, unknown>>
) => Promise<S12FetchResponse>;

export class OpenRouterHttpError extends Error {
  constructor(
    readonly code: "HTTP_ERROR" | "MALFORMED_RESPONSE",
    readonly httpStatus: number | undefined,
    message: string
  ) {
    super(message);
    this.name = "OpenRouterHttpError";
  }
}

export class OpenRouterHttpTransport implements OpenRouterTransport {
  constructor(
    private readonly fetcher: S12Fetch = globalThis.fetch as unknown as S12Fetch,
    private readonly baseUrl = OPENROUTER_API_BASE
  ) {}

  async listModels(
    apiKey: string,
    options?: { readonly signal?: AbortSignal }
  ): Promise<readonly OpenRouterModelMetadata[]> {
    const body = await this.request("/models", "GET", apiKey, undefined, options?.signal);
    const data = asRecord(body)["data"];
    if (!Array.isArray(data))
      throw new OpenRouterHttpError("MALFORMED_RESPONSE", 200, "Model list is malformed.");
    return data.map((entry) => {
      const item = asRecord(entry);
      return {
        id: String(item["id"] ?? ""),
        pricing: pricing(item["pricing"]),
        supportedParameters: strings(item["supported_parameters"])
      };
    });
  }

  async listEndpoints(
    modelId: string,
    apiKey: string,
    options?: { readonly signal?: AbortSignal }
  ): Promise<readonly OpenRouterEndpointMetadata[]> {
    const [author, slug] = modelId.split("/", 2);
    const body = await this.request(
      `/models/${encodeURIComponent(author!)}/${encodeURIComponent(slug!)}/endpoints`,
      "GET",
      apiKey,
      undefined,
      options?.signal
    );
    const data = asRecord(asRecord(body)["data"]);
    const endpoints = data["endpoints"];
    if (!Array.isArray(endpoints))
      throw new OpenRouterHttpError("MALFORMED_RESPONSE", 200, "Endpoint list is malformed.");
    return endpoints.map((entry) => {
      const item = asRecord(entry);
      return {
        name: String(item["name"] ?? ""),
        modelId,
        providerName: String(item["provider_name"] ?? ""),
        tag: String(item["tag"] ?? ""),
        pricing: pricing(item["pricing"]),
        supportedParameters: strings(item["supported_parameters"])
      };
    });
  }

  async generate(
    request: Readonly<Record<string, unknown>>,
    apiKey: string,
    signal: AbortSignal,
    wireRequestPrepared?: (evidence: { readonly wireRequestDigest: string }) => void
  ): Promise<OpenRouterGenerationResponse> {
    const body = serializeOpenRouterRequestBody(request);
    wireRequestPrepared?.({ wireRequestDigest: localWireRequestDigest(body) });
    const raw = await this.request("/chat/completions", "POST", apiKey, body, signal);
    const response = asRecord(raw);
    const choices = response["choices"];
    if (!Array.isArray(choices) || choices.length === 0)
      throw new OpenRouterHttpError("MALFORMED_RESPONSE", 200, "Completion has no choices.");
    const message = asRecord(asRecord(choices[0])["message"]);
    const calls = Array.isArray(message["tool_calls"]) ? message["tool_calls"] : [];
    const usage = asRecord(response["usage"]);
    return {
      responseId: String(response["id"] ?? ""),
      model: String(response["model"] ?? ""),
      provider: typeof response["provider"] === "string" ? response["provider"] : undefined,
      message: {
        role: "assistant",
        content: typeof message["content"] === "string" ? message["content"] : ""
      },
      toolCalls: calls.map((value) => {
        const call = asRecord(value);
        const fn = asRecord(call["function"]);
        let args: Record<string, unknown> = {};
        try {
          args = asRecord(JSON.parse(String(fn["arguments"] ?? "{}")));
        } catch {
          throw new OpenRouterHttpError(
            "MALFORMED_RESPONSE",
            200,
            "Tool arguments are invalid JSON."
          );
        }
        return { id: String(call["id"] ?? ""), name: String(fn["name"] ?? ""), arguments: args };
      }),
      usage: {
        inputTokens: numberOrUndefined(usage["prompt_tokens"]),
        outputTokens: numberOrUndefined(usage["completion_tokens"]),
        reasoningTokens: numberOrUndefined(
          asRecord(usage["completion_tokens_details"])["reasoning_tokens"]
        ),
        reportedCostUsd: numberOrUndefined(usage["cost"])
      }
    };
  }

  private async request(
    path: string,
    method: "GET" | "POST",
    apiKey: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<unknown> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {})
    });
    if (!response.ok)
      throw new OpenRouterHttpError(
        "HTTP_ERROR",
        response.status,
        `OpenRouter returned HTTP ${response.status}.`
      );
    try {
      return await response.json();
    } catch {
      throw new OpenRouterHttpError(
        "MALFORMED_RESPONSE",
        response.status,
        "OpenRouter returned invalid JSON."
      );
    }
  }
}

function serializeMessage(message: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    role: message["role"],
    content: message["content"]
  };
  if (typeof message["toolCallId"] === "string") result["tool_call_id"] = message["toolCallId"];
  if (Array.isArray(message["toolCalls"])) {
    result["tool_calls"] = message["toolCalls"].map((value) => {
      const call = asRecord(value);
      return {
        id: call["id"],
        type: "function",
        function: { name: call["name"], arguments: canonicalJson(call["arguments"] ?? {}) }
      };
    });
  }
  return result;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function pricing(value: unknown) {
  const item = asRecord(value);
  return { prompt: String(item["prompt"] ?? ""), completion: String(item["completion"] ?? "") };
}
function strings(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
function numberOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value);
  return value === undefined || !Number.isFinite(parsed) ? undefined : parsed;
}
