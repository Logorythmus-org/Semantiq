/**
 * @package @tech-club/adapter-opensandbox
 * OpenSandbox Wire Protocol Types
 */

export interface OpenSandboxConfig {
  readonly endpoint: string;
  readonly authToken?: string | undefined;
  readonly defaultTimeoutMs?: number | undefined;
}

export interface OpenSandboxDaemonInfo {
  readonly version: string;
  readonly backendEngine: string;
  readonly kernelVersion: string;
  readonly isolationMechanism: string;
  readonly engineCapabilities: {
    readonly snapshots: boolean;
    readonly fsDiff: boolean;
  };
  readonly supportedArchitectures: readonly ("x86_64" | "aarch64")[];
}

export interface CreateSandboxWireRequest {
  readonly image: string;
  readonly workingDir?: string | undefined;
  readonly env?: Record<string, string> | undefined;
  readonly resources?:
    | {
        readonly cpuCores?: number | undefined;
        readonly memoryMb?: number | undefined;
        readonly diskMb?: number | undefined;
        readonly pidsMax?: number | undefined;
      }
    | undefined;
  readonly security?:
    | {
        readonly networkMode?: string | undefined;
        readonly allowedEgressHosts?: readonly string[] | undefined;
        readonly readOnlyRoot?: boolean | undefined;
        readonly unprivilegedUser?: string | undefined;
      }
    | undefined;
}

export interface CreateSandboxWireResponse {
  readonly sandboxId: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface ExecWireRequest {
  readonly command: readonly string[];
  readonly stdinBase64?: string | undefined;
  readonly workingDir?: string | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface ExecWireResponse {
  readonly exitCode: number;
  readonly peakMemoryBytes?: number | undefined;
  readonly timedOut?: boolean | undefined;
  readonly oomKilled?: boolean | undefined;
}

export interface OpenSandboxDiffWireResponse {
  readonly created: readonly { path: string; sha256: string; size: number }[];
  readonly modified: readonly {
    path: string;
    preSha256: string;
    postSha256: string;
    diff: string;
  }[];
  readonly deleted: readonly string[];
}
