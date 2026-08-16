/**
 * @package @semantiq/sandbox-contracts
 * Sandbox Benchmark DSL and Declarative Scenario Compiler Architecture
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import type { EnvironmentSpec, ExecutionRequest } from "./types.js";

export type DSLLicense = "MIT" | "Apache-2.0" | "BSD-3-Clause" | "CC-BY-4.0" | "Proprietary";

export interface DSLMetadata {
  readonly benchmarkId: string;
  readonly scenarioId: string;
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly license: DSLLicense;
  readonly author: string;
}

export interface DSLEnvironment {
  readonly runtimeType: "container" | "microvm" | "local_process";
  readonly baseImage: string;
  readonly resources: {
    readonly cpuCores: number;
    readonly memoryMb: number;
    readonly diskGb: number;
    readonly gpuCount?: number;
  };
  readonly networkPolicy: "ISOLATED" | "EGRESS_ALLOWLIST" | "FULL_ACCESS";
  readonly egressAllowlist?: readonly string[];
  readonly envVars?: Record<string, string>;
  readonly preinstalledPackages?: readonly string[];
  readonly volumeMounts?: readonly {
    readonly sourcePath: string;
    readonly targetMountPath: string;
    readonly readOnly: boolean;
  }[];
}

export interface DSLActor {
  readonly actorId: string;
  readonly role: "PRIMARY_AGENT" | "EVALUATOR" | "MOCK_PEER" | "USER_PROXY";
  readonly allowedTools: readonly string[];
  readonly permissionLevel: "SANDBOX_USER" | "SUDO_ROOT" | "RESTRICTED_READONLY";
}

export interface DSLToolDefinition {
  readonly name: string;
  readonly type: "BASH" | "FILE_SYSTEM" | "HTTP_API" | "BROWSER" | "MCP_SERVER";
  readonly description: string;
  readonly timeoutMs: number;
  readonly config?: Record<string, unknown>;
}

export interface DSLPerturbation {
  readonly perturbationId: string;
  readonly mode:
    | "CONTEXT_LOSS_TRUNCATION"
    | "TOOL_RPC_ERROR"
    | "NETWORK_PARTITION_LATENCY"
    | "STALE_STATE_DRIFT"
    | "CONTRADICTION_MUTATION"
    | "PERMISSION_REVOCATION"
    | "PARTIAL_RESULT_CORRUPTION";
  readonly triggerStep: number;
  readonly parameters: Record<string, unknown>;
}

export interface DSLMilestone {
  readonly milestoneId: string;
  readonly phase:
    | "DISCOVERY_AND_RECON"
    | "ARCHITECTURAL_PLANNING"
    | "SCAFFOLD_AND_BOOTSTRAP"
    | "INCREMENTAL_IMPLEMENTATION"
    | "INTEGRATION_AND_TESTING"
    | "VERIFICATION_AND_FINALIZE";
  readonly description: string;
  readonly stepBudget: number;
  readonly requiredArtifacts: readonly string[];
}

export interface DSLAssertion {
  readonly assertionId: string;
  readonly targetStep?: number;
  readonly type:
    | "EXIT_CODE_EQUALS"
    | "FILE_EXISTS"
    | "FILE_CONTAINS_REGEX"
    | "COMMAND_OUTPUT_MATCHES"
    | "TEST_SUITE_PASSES"
    | "RRI_THRESHOLD"
    | "CAI_THRESHOLD";
  readonly params: Record<string, unknown>;
  readonly weight: number; // 0.0 to 1.0
}

export interface DSLLifecycle {
  readonly setupCommands: readonly string[];
  readonly maxDurationSeconds: number;
  readonly totalStepBudget: number;
  readonly retryBudget: number;
  readonly teardownCommands: readonly string[];
}

export interface SandboxBenchmarkDSL {
  readonly dslVersion: "1.0.0";
  readonly metadata: DSLMetadata;
  readonly environment: DSLEnvironment;
  readonly actors: readonly DSLActor[];
  readonly tools: readonly DSLToolDefinition[];
  readonly perturbations?: readonly DSLPerturbation[];
  readonly milestones?: readonly DSLMilestone[];
  readonly assertions: readonly DSLAssertion[];
  readonly lifecycle: DSLLifecycle;
  readonly extensions?: Record<string, Record<string, unknown>>; // Namespaced provider extensions
}

export interface CompiledBenchmarkContract {
  readonly scenarioId: string;
  readonly environmentSpec: EnvironmentSpec;
  readonly executionRequest: ExecutionRequest;
  readonly canonicalDigest: string;
  readonly compiledAt: string;
}

/**
 * Sandbox Benchmark DSL Compiler & Validator.
 * Compiles declarative scenario manifests into provider-neutral execution contracts.
 */
export class SandboxBenchmarkCompiler {
  validate(dsl: SandboxBenchmarkDSL): { valid: boolean; errors: readonly string[] } {
    const errors: string[] = [];

    if (dsl.dslVersion !== "1.0.0") {
      errors.push(`Unsupported DSL version: ${dsl.dslVersion}`);
    }

    if (!dsl.metadata.benchmarkId || !dsl.metadata.scenarioId) {
      errors.push("Metadata must include non-empty benchmarkId and scenarioId");
    }

    if (dsl.actors.length === 0) {
      errors.push("At least one actor must be declared");
    }

    const hasPrimaryAgent = dsl.actors.some((a) => a.role === "PRIMARY_AGENT");
    if (!hasPrimaryAgent) {
      errors.push("Scenario must define at least one PRIMARY_AGENT actor");
    }

    // Verify actor tool references exist in declared tools
    const declaredToolNames = new Set(dsl.tools.map((t) => t.name));
    for (const actor of dsl.actors) {
      for (const tool of actor.allowedTools) {
        if (!declaredToolNames.has(tool)) {
          errors.push(`Actor ${actor.actorId} references undeclared tool: ${tool}`);
        }
      }
    }

    // Verify milestone step budgets sum up within totalStepBudget
    if (dsl.milestones && dsl.milestones.length > 0) {
      const milestoneBudgetSum = dsl.milestones.reduce((acc, m) => acc + m.stepBudget, 0);
      if (milestoneBudgetSum > dsl.lifecycle.totalStepBudget) {
        errors.push(
          `Milestone step budgets (${milestoneBudgetSum}) exceed totalStepBudget (${dsl.lifecycle.totalStepBudget})`
        );
      }
    }

    // Verify assertion weights sum to <= 1.0 (with slight float tolerance)
    const weightSum = dsl.assertions.reduce((acc, a) => acc + a.weight, 0);
    if (weightSum > 1.05) {
      errors.push(`Assertion weights sum to ${weightSum}, exceeding 1.0`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  compile(dsl: SandboxBenchmarkDSL): CompiledBenchmarkContract {
    const validation = this.validate(dsl);
    if (!validation.valid) {
      throw new Error(`DSL Compilation Failed: ${validation.errors.join("; ")}`);
    }

    const environmentSpec: EnvironmentSpec = {
      specVersion: "1.0.0",
      runtimeType:
        dsl.environment.runtimeType === "local_process" ? "container" : dsl.environment.runtimeType,
      image: {
        name: dsl.environment.baseImage,
        digest: "sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0"
      },
      workingDirectory: "/workspace",
      resources: {
        cpuLimitCores: dsl.environment.resources.cpuCores,
        memoryLimitMebibytes: dsl.environment.resources.memoryMb,
        diskLimitMebibytes: dsl.environment.resources.diskGb * 1024,
        maxExecutionTimeoutSeconds: dsl.lifecycle.maxDurationSeconds
      },
      security: {
        networkMode: dsl.environment.networkPolicy === "ISOLATED" ? "none" : "isolated_bridge",
        readOnlyRootFilesystem: false
      },
      environmentVariables: dsl.environment.envVars ?? {}
    };

    const executionRequest: ExecutionRequest = {
      requestId: `req-${dsl.metadata.scenarioId}`,
      command:
        dsl.lifecycle.setupCommands.length > 0 ? dsl.lifecycle.setupCommands : ["echo", "Ready"],
      timeoutMs: dsl.lifecycle.maxDurationSeconds * 1000
    };

    const canonicalDigest = computeSha256(canonicalJson(dsl));

    return {
      scenarioId: dsl.metadata.scenarioId,
      environmentSpec,
      executionRequest,
      canonicalDigest,
      compiledAt: new Date().toISOString()
    };
  }
}
