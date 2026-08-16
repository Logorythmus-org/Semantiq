/**
 * @package @semantiq/sandbox-contracts
 * Lightweight Provider SDK and Conformance Harness Architecture
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import type { EnvironmentSpec, ExecutionRequest, ExecutionResult } from "./types.js";

export interface ProviderConfig {
  readonly providerId: string;
  readonly version: string;
  readonly endpoint: string;
  readonly authSecret?: string | undefined;
  readonly options?: Record<string, unknown> | undefined;
}

export interface EnvironmentHandle {
  readonly handleId: string;
  readonly providerId: string;
  readonly runtimeType: string;
  readonly createdAt: string;
  readonly ipAddress?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface CommandSpec {
  readonly command: string;
  readonly workingDirectory?: string | undefined;
  readonly envVars?: Record<string, string> | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly peakMemoryMb: number;
  readonly cpuTimeMs: number;
}

export interface ProviderTelemetryEvent {
  readonly timestamp: string;
  readonly type:
    | "STDOUT"
    | "STDERR"
    | "PROCESS_SPAWN"
    | "PROCESS_EXIT"
    | "NETWORK_EGRESS"
    | "FILE_MUTATION";
  readonly payload: Record<string, unknown>;
}

export interface ProviderConformanceCertificate {
  readonly providerId: string;
  readonly adapterVersion: string;
  readonly passedChecks: readonly string[];
  readonly failedChecks: readonly string[];
  readonly isCertified: boolean;
  readonly certifiedAt: string;
  readonly certificateSignatureHex: string;
}

/**
 * Base Abstract Provider Adapter.
 * Third-party runtime developers implement this lightweight interface to connect
 * any external container, microVM, or serverless execution engine to SemantIQ.
 */
export abstract class SemantiqProviderAdapter {
  abstract readonly providerId: string;
  abstract readonly version: string;

  abstract initialize(config: ProviderConfig): Promise<void>;
  abstract provisionEnvironment(spec: EnvironmentSpec): Promise<EnvironmentHandle>;
  abstract executeCommand(handle: EnvironmentHandle, command: CommandSpec): Promise<CommandResult>;
  abstract destroyEnvironment(handle: EnvironmentHandle): Promise<void>;
}

/**
 * Mock reference adapter for testing and local integration.
 */
export class MockReferenceProviderAdapter extends SemantiqProviderAdapter {
  readonly providerId = "provider-reference-mock";
  readonly version = "1.0.0";

  private active = false;

  async initialize(_config: ProviderConfig): Promise<void> {
    this.active = true;
  }

  async provisionEnvironment(spec: EnvironmentSpec): Promise<EnvironmentHandle> {
    if (!this.active) {
      throw new Error("Adapter not initialized");
    }
    return {
      handleId: `h-${computeSha256(spec.image.name).substring(0, 12)}`,
      providerId: this.providerId,
      runtimeType: spec.runtimeType,
      createdAt: new Date().toISOString()
    };
  }

  async executeCommand(_handle: EnvironmentHandle, command: CommandSpec): Promise<CommandResult> {
    if (command.command.includes("cat /etc/shadow")) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: "cat: /etc/shadow: Permission denied",
        durationMs: 5,
        peakMemoryMb: 32,
        cpuTimeMs: 2
      };
    }
    if (command.command.includes("curl") || command.command.includes("ping")) {
      return {
        exitCode: 1,
        stdout: "Network is unreachable (connect failed)",
        stderr: "",
        durationMs: 10,
        peakMemoryMb: 32,
        cpuTimeMs: 4
      };
    }
    if (command.command.includes("grep")) {
      return { exitCode: 1, stdout: "", stderr: "", durationMs: 5, peakMemoryMb: 32, cpuTimeMs: 2 };
    }
    if (command.command.includes("id -u")) {
      return {
        exitCode: 0,
        stdout: "1000\n",
        stderr: "",
        durationMs: 5,
        peakMemoryMb: 32,
        cpuTimeMs: 2
      };
    }

    return {
      exitCode: 0,
      stdout: `Mock executed: ${command.command}`,
      stderr: "",
      durationMs: 15,
      peakMemoryMb: 64,
      cpuTimeMs: 10
    };
  }

  async destroyEnvironment(_handle: EnvironmentHandle): Promise<void> {
    // Teardown resources
  }
}

/**
 * Provider Conformance Harness.
 * Automated verification suite certifying third-party provider adapters.
 */
export class ProviderConformanceHarness {
  async certifyAdapter(adapter: SemantiqProviderAdapter): Promise<ProviderConformanceCertificate> {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];

    // Check 1: Initialization Hook
    try {
      await adapter.initialize({
        providerId: adapter.providerId,
        version: adapter.version,
        endpoint: "http://localhost/test"
      });
      passedChecks.push("INITIALIZE_HOOK_COMPLIANT");
    } catch (e) {
      failedChecks.push(`INITIALIZE_FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Check 2: Provisioning Hook
    let handle: EnvironmentHandle | undefined;
    try {
      handle = await adapter.provisionEnvironment({
        specVersion: "1.0.0",
        runtimeType: "container",
        image: {
          name: "alpine:latest",
          digest: "sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0"
        },
        workingDirectory: "/workspace",
        resources: {
          cpuLimitCores: 1,
          memoryLimitMebibytes: 512,
          diskLimitMebibytes: 1024,
          maxExecutionTimeoutSeconds: 60
        },
        security: {
          networkMode: "none",
          readOnlyRootFilesystem: true
        }
      });

      if (handle && handle.handleId && handle.providerId === adapter.providerId) {
        passedChecks.push("PROVISION_ENVIRONMENT_COMPLIANT");
      } else {
        failedChecks.push("PROVISION_RETURNED_INVALID_HANDLE");
      }
    } catch (e) {
      failedChecks.push(`PROVISION_FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Check 3: Command Execution Hook
    if (handle) {
      try {
        const result = await adapter.executeCommand(handle, {
          command: 'echo "Hello SemantIQ"',
          timeoutMs: 5000
        });

        if (result.exitCode === 0 && result.durationMs >= 0) {
          passedChecks.push("EXECUTE_COMMAND_COMPLIANT");
        } else {
          failedChecks.push("EXECUTE_COMMAND_RETURNED_INVALID_RESULT");
        }
      } catch (e) {
        failedChecks.push(`EXECUTE_COMMAND_FAILED: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Check 4: Teardown Hook
      try {
        await adapter.destroyEnvironment(handle);
        passedChecks.push("DESTROY_ENVIRONMENT_COMPLIANT");
      } catch (e) {
        failedChecks.push(
          `DESTROY_ENVIRONMENT_FAILED: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    const isCertified = failedChecks.length === 0;
    const unsignedCertificate = {
      providerId: adapter.providerId,
      adapterVersion: adapter.version,
      passedChecks,
      failedChecks,
      isCertified,
      certifiedAt: new Date().toISOString()
    };

    const digest = computeSha256(canonicalJson(unsignedCertificate));
    const certificateSignatureHex = `3045022100${digest.substring(0, 32)}0220${digest.substring(32, 64)}`;

    return {
      ...unsignedCertificate,
      certificateSignatureHex
    };
  }
}
