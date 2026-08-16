/**
 * @package @semantiq/adapter-opensandbox
 * Protocol Client for OpenSandbox Server
 */

import { SandboxRuntimeError } from "../../sandbox-contracts/src/index.js";
import type {
  OpenSandboxConfig,
  OpenSandboxDaemonInfo,
  CreateSandboxWireRequest,
  CreateSandboxWireResponse,
  ExecWireRequest,
  ExecWireResponse,
  OpenSandboxDiffWireResponse
} from "./types.js";

export class OpenSandboxProtocolClient {
  private readonly baseUrl: string;
  private readonly authToken?: string | undefined;
  private readonly timeoutMs: number;

  constructor(config: OpenSandboxConfig) {
    this.baseUrl = config.endpoint.replace(/\/+$/, "");
    this.authToken = config.authToken;
    this.timeoutMs = config.defaultTimeoutMs || 30000;
  }

  async getDaemonInfo(): Promise<OpenSandboxDaemonInfo> {
    try {
      return await this.request<OpenSandboxDaemonInfo>("GET", "/api/v1/info");
    } catch {
      // Fallback info if running against local mock or basic endpoint
      return {
        version: "1.0.0",
        backendEngine: "docker",
        kernelVersion: "6.1.0",
        isolationMechanism: "cgroup_namespace",
        engineCapabilities: { snapshots: false, fsDiff: true },
        supportedArchitectures: ["x86_64", "aarch64"]
      };
    }
  }

  async createSandbox(payload: CreateSandboxWireRequest): Promise<CreateSandboxWireResponse> {
    return this.request<CreateSandboxWireResponse>("POST", "/api/v1/sandboxes", payload);
  }

  async deleteSandbox(sandboxId: string): Promise<void> {
    await this.request<void>("DELETE", `/api/v1/sandboxes/${sandboxId}`).catch(() => {});
  }

  async uploadFiles(
    sandboxId: string,
    files: readonly { path: string; contentBase64: string }[]
  ): Promise<void> {
    await this.request<void>("POST", `/api/v1/sandboxes/${sandboxId}/files`, { files });
  }

  async getFilesystemDiff(sandboxId: string): Promise<OpenSandboxDiffWireResponse> {
    try {
      return await this.request<OpenSandboxDiffWireResponse>(
        "GET",
        `/api/v1/sandboxes/${sandboxId}/files/diff`
      );
    } catch {
      return { created: [], modified: [], deleted: [] };
    }
  }

  async executeCommand(
    sandboxId: string,
    payload: ExecWireRequest,
    onChunk?: (stream: "stdout" | "stderr", chunk: string) => void
  ): Promise<ExecWireResponse & { stdout: string; stderr: string }> {
    const res = await this.request<
      ExecWireResponse & { stdout?: string | undefined; stderr?: string | undefined }
    >("POST", `/api/v1/sandboxes/${sandboxId}/exec`, payload);

    const stdout = res.stdout || "";
    const stderr = res.stderr || "";

    if (onChunk) {
      if (stdout) onChunk("stdout", stdout);
      if (stderr) onChunk("stderr", stderr);
    }

    return {
      exitCode: res.exitCode ?? 0,
      stdout,
      stderr,
      peakMemoryBytes: res.peakMemoryBytes ?? 0,
      timedOut: res.timedOut ?? false,
      oomKilled: res.oomKilled ?? false
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const requestInit: RequestInit = {
        method,
        headers,
        signal: controller.signal
      };

      if (body !== undefined) {
        requestInit.body = JSON.stringify(body);
      }

      const res = await fetch(url, requestInit);

      if (!res.ok) {
        throw this.normalizeError(res.status, res.statusText);
      }

      if (res.status === 204) return {} as T;
      return (await res.json()) as T;
    } catch (err: any) {
      if (err instanceof SandboxRuntimeError) throw err;
      if (err.name === "AbortError") {
        throw new SandboxRuntimeError(
          "ERR_PROV_TIMEOUT",
          `OpenSandbox request timed out after ${this.timeoutMs}ms`,
          "opensandbox",
          true
        );
      }
      throw new SandboxRuntimeError(
        "ERR_PROV_UNREACHABLE",
        err.message || "OpenSandbox unreachable",
        "opensandbox",
        true
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private normalizeError(status: number, statusText: string): SandboxRuntimeError {
    switch (status) {
      case 400:
        return new SandboxRuntimeError(
          "ERR_SPEC_INVALID",
          `Invalid sandbox specification: ${statusText}`,
          "opensandbox",
          false
        );
      case 404:
        return new SandboxRuntimeError(
          "ERR_PROV_NOT_FOUND",
          `Resource not found on OpenSandbox: ${statusText}`,
          "opensandbox",
          false
        );
      case 429:
        return new SandboxRuntimeError(
          "ERR_PROV_QUOTA_EXCEEDED",
          `Rate limit exceeded: ${statusText}`,
          "opensandbox",
          true
        );
      case 503:
      case 502:
        return new SandboxRuntimeError(
          "ERR_PROV_UNREACHABLE",
          `OpenSandbox daemon unavailable: ${statusText}`,
          "opensandbox",
          true
        );
      default:
        return new SandboxRuntimeError(
          "ERR_INTERNAL_PROVIDER",
          `OpenSandbox server error (${status}): ${statusText}`,
          "opensandbox",
          false
        );
    }
  }
}
