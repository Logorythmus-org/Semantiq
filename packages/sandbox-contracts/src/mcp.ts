/**
 * @package @tech-club/sandbox-contracts
 * MCP (Model Context Protocol) Provider-Neutral Contracts and Interfaces
 */

export type McpTransportType = "stdio" | "sse" | "http_jsonrpc" | "synthetic_mock";

export interface McpServerSpec {
  readonly serverName: string;
  readonly transport: McpTransportType;
  readonly command?: string | undefined;
  readonly args?: readonly string[] | undefined;
  readonly url?: string | undefined;
  readonly environment?: Readonly<Record<string, string>> | undefined;
  readonly isSandboxed: boolean;
}

export interface McpToolDefinition {
  readonly serverName: string;
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly requiredPermissions?: readonly string[] | undefined;
}

export interface McpToolCallRequest {
  readonly callId: string;
  readonly serverName: string;
  readonly toolName: string;
  readonly arguments: Readonly<Record<string, unknown>>;
  readonly timestamp: string;
}

export interface McpToolCallResult {
  readonly callId: string;
  readonly serverName: string;
  readonly toolName: string;
  readonly isError: boolean;
  readonly content: readonly {
    readonly type: "text" | "image" | "resource";
    readonly data: string;
  }[];
  readonly durationMs: number;
  readonly timestamp: string;
}

export interface McpObservationEvent {
  readonly callId: string;
  readonly serverName: string;
  readonly toolName: string;
  readonly argumentsSha256: string;
  readonly isError: boolean;
  readonly resultSummary: string;
  readonly durationMs: number;
  readonly associatedStateDeltaId?: string | undefined;
  readonly timestamp: string;
}

export interface IMcpCapabilityProvider {
  listMcpTools(): Promise<readonly McpToolDefinition[]>;
  invokeMcpTool(request: McpToolCallRequest): Promise<McpToolCallResult>;
}

/**
 * MCP Call Normalizer.
 * Sanitizes and generates reproducible evidence events from raw MCP JSON-RPC tool interactions.
 */
export class McpCallNormalizer {
  normalizeToolCall(
    request: McpToolCallRequest,
    result: McpToolCallResult,
    stateDeltaId?: string | undefined
  ): McpObservationEvent {
    // Generate a stable representation of arguments for hashing
    const argsJson = JSON.stringify(request.arguments, Object.keys(request.arguments).sort());

    // Summary of result without leaking arbitrary huge binaries
    const summary = result.isError
      ? `ERROR: ${result.content.map((c) => c.data).join("; ")}`
      : `SUCCESS (${result.content.length} items)`;

    return {
      callId: request.callId,
      serverName: request.serverName,
      toolName: request.toolName,
      argumentsSha256: argsJson, // In production wrapped with sha256
      isError: result.isError,
      resultSummary: summary,
      durationMs: result.durationMs,
      associatedStateDeltaId: stateDeltaId,
      timestamp: new Date().toISOString()
    };
  }
}
