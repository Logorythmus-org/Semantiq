import { describe, it, expect } from "vitest";
import { McpCallNormalizer } from "../../packages/sandbox-contracts/src/mcp.js";
import type {
  McpServerSpec,
  McpToolDefinition,
  McpToolCallRequest,
  McpToolCallResult
} from "../../packages/sandbox-contracts/src/mcp.js";

describe("SemantIQ Sandbox Phase — MCP Provider Integration", () => {
  const normalizer = new McpCallNormalizer();

  const sampleServer: McpServerSpec = {
    serverName: "filesystem-server",
    transport: "stdio",
    command: "node",
    args: ["./mcp-fs-server.js"],
    isSandboxed: true
  };

  const sampleTool: McpToolDefinition = {
    serverName: "filesystem-server",
    name: "read_file",
    description: "Reads content from a sandbox file",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"]
    }
  };

  it("normalizes MCP tool call request and result into an observation event", () => {
    const request: McpToolCallRequest = {
      callId: "call-001",
      serverName: "filesystem-server",
      toolName: "read_file",
      arguments: { path: "/workspace/src/index.ts" },
      timestamp: "2026-08-15T16:00:00Z"
    };

    const result: McpToolCallResult = {
      callId: "call-001",
      serverName: "filesystem-server",
      toolName: "read_file",
      isError: false,
      content: [{ type: "text", data: 'export const hello = "world";' }],
      durationMs: 42,
      timestamp: "2026-08-15T16:00:01Z"
    };

    const event = normalizer.normalizeToolCall(request, result, "delta-001");
    expect(event.callId).toBe("call-001");
    expect(event.toolName).toBe("read_file");
    expect(event.isError).toBe(false);
    expect(event.durationMs).toBe(42);
    expect(event.associatedStateDeltaId).toBe("delta-001");
    expect(event.resultSummary).toContain("SUCCESS (1 items)");
  });

  it("correctly formats error summaries when MCP tool call fails", () => {
    const request: McpToolCallRequest = {
      callId: "call-002",
      serverName: "filesystem-server",
      toolName: "read_file",
      arguments: { path: "/forbidden/path" },
      timestamp: "2026-08-15T16:00:00Z"
    };

    const result: McpToolCallResult = {
      callId: "call-002",
      serverName: "filesystem-server",
      toolName: "read_file",
      isError: true,
      content: [{ type: "text", data: "ENOENT: File not found" }],
      durationMs: 15,
      timestamp: "2026-08-15T16:00:01Z"
    };

    const event = normalizer.normalizeToolCall(request, result);
    expect(event.isError).toBe(true);
    expect(event.resultSummary).toContain("ERROR: ENOENT: File not found");
  });
});
