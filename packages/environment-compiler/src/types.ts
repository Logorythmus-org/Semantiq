/**
 * @package @semantiq/environment-compiler
 * Benchmark Declaration & Compiler Types
 */

import type { EnvironmentSpec } from "../../sandbox-contracts/src/index.js";

export interface InjectedFileDeclaration {
  readonly path: string;
  readonly content: string;
  readonly encoding?: "utf-8" | "base64";
  readonly isExecutable?: boolean;
}

export interface BenchmarkTaskDeclaration {
  readonly declarationVersion: "1.0.0";
  readonly taskId: string;
  readonly taskDescription?: string;

  readonly baseProfile: {
    readonly name:
      | "python_datascience"
      | "typescript_node"
      | "rust_systems"
      | "browser_playwright"
      | "swe_bench"
      | "custom";
    readonly version: string;
    readonly customImage?: { readonly name: string; readonly digest: string };
  };

  readonly workspace: {
    readonly workingDirectory?: string;
    readonly gitRepository?: {
      readonly url: string;
      readonly commitHash: string;
      readonly subpath?: string;
    };
    readonly injectedFiles?: readonly InjectedFileDeclaration[];
  };

  readonly resources?: {
    readonly cpuCores?: number;
    readonly memoryMb?: number;
    readonly diskMb?: number;
    readonly timeoutSeconds?: number;
    readonly gpuRequired?: boolean;
  };

  readonly security?: {
    readonly networkPolicy?: "none" | "isolated_bridge" | "whitelisted_egress";
    readonly whitelistedHosts?: readonly string[];
    readonly readOnlyRoot?: boolean;
    readonly unprivilegedUser?: string;
  };

  readonly environmentVariables?: Readonly<Record<string, string>>;
  readonly deterministicSeed?: string;
}

export interface CompilationResult {
  readonly environmentSpec: EnvironmentSpec;
  readonly specHash: string;
  readonly initialRootMerkleHash: string;
  readonly compilationTimestamp: string;
  readonly warnings: readonly string[];
}

export interface IEnvironmentCompiler {
  compile(declaration: BenchmarkTaskDeclaration): Promise<CompilationResult>;
  validateDeclaration(
    declaration: BenchmarkTaskDeclaration
  ): Promise<{ isValid: boolean; errors: readonly string[] }>;
}
