/**
 * @package @semantiq/environment-compiler
 * Four-Stage Environment Compilation Engine
 */

import {
  type EnvironmentSpec,
  type InitialFileEntry,
  computeSha256,
  computeSpecHash,
  computeMerkleRoot
} from "../../sandbox-contracts/src/index.js";
import type { BenchmarkTaskDeclaration, CompilationResult, IEnvironmentCompiler } from "./types.js";

export class EnvironmentCompiler implements IEnvironmentCompiler {
  private readonly profileCatalog: Readonly<
    Record<string, { readonly name: string; readonly digest: string }>
  > = {
    "python_datascience:3.11": {
      name: "semantiq/profile-python-datascience",
      digest: "sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0"
    },
    "typescript_node:20": {
      name: "semantiq/profile-typescript-node",
      digest: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    },
    "browser_playwright:1.40": {
      name: "semantiq/profile-browser-playwright",
      digest: "sha256:4b825dc642c23ca50f55c0e1cad8c47ac64965a4a328f3b4d744e4c02e860563"
    },
    "swe_bench:default": {
      name: "semantiq/profile-swebench-runner",
      digest: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    }
  };

  async validateDeclaration(
    decl: BenchmarkTaskDeclaration
  ): Promise<{ isValid: boolean; errors: readonly string[] }> {
    const errors: string[] = [];
    if (!decl.taskId) errors.push("Missing required taskId");
    if (!decl.baseProfile) errors.push("Missing required baseProfile");
    return { isValid: errors.length === 0, errors };
  }

  async compile(decl: BenchmarkTaskDeclaration): Promise<CompilationResult> {
    const validation = await this.validateDeclaration(decl);
    if (!validation.isValid) {
      throw new Error(`Declaration validation failed: ${validation.errors.join(", ")}`);
    }

    // 1. Resolve Base Image Digest
    const profileKey = `${decl.baseProfile.name}:${decl.baseProfile.version}`;
    let resolvedImage = { name: "", digest: "" };

    if (decl.baseProfile.name === "custom" && decl.baseProfile.customImage) {
      resolvedImage = decl.baseProfile.customImage;
    } else if (this.profileCatalog[profileKey]) {
      resolvedImage = this.profileCatalog[profileKey]!;
    } else {
      // Fallback for custom or direct names with pinned dummy digest for testing
      resolvedImage = {
        name: `semantiq/profile-${decl.baseProfile.name}`,
        digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      };
    }

    // 2. Materialize Initial Filesystem & Merkle Tree
    const initialFilesystem: InitialFileEntry[] = [];
    const merkleEntries: { path: string; sha256: string }[] = [];

    for (const file of decl.workspace.injectedFiles || []) {
      const contentBuffer =
        file.encoding === "base64"
          ? Buffer.from(file.content, "base64")
          : Buffer.from(file.content, "utf-8");

      const fileSha256 = computeSha256(contentBuffer);
      initialFilesystem.push({
        path: file.path,
        contentBase64: contentBuffer.toString("base64"),
        sha256: fileSha256,
        mode: file.isExecutable ? "0755" : "0644"
      });
      merkleEntries.push({ path: file.path, sha256: fileSha256 });
    }

    const initialRootMerkleHash = computeMerkleRoot(merkleEntries);

    // 3. Assemble EnvironmentSpec
    const environmentSpec: EnvironmentSpec = {
      specVersion: "1.0.0",
      runtimeType: "container",
      image: {
        name: resolvedImage.name,
        digest: resolvedImage.digest
      },
      workingDirectory: decl.workspace.workingDirectory || "/workspace",
      environmentVariables: {
        ...(decl.environmentVariables || {}),
        SEMANTIQ_TASK_ID: decl.taskId,
        SEMANTIQ_DETERMINISTIC_SEED: decl.deterministicSeed || "42"
      },
      resources: {
        cpuLimitCores: decl.resources?.cpuCores || 2.0,
        memoryLimitMebibytes: decl.resources?.memoryMb || 2048,
        diskLimitMebibytes: decl.resources?.diskMb || 5120,
        maxProcessCount: 128,
        maxExecutionTimeoutSeconds: decl.resources?.timeoutSeconds || 300
      },
      security: {
        networkMode: decl.security?.networkPolicy || "none",
        whitelistedHosts: decl.security?.whitelistedHosts || [],
        readOnlyRootFilesystem: decl.security?.readOnlyRoot ?? true,
        unprivilegedUser: decl.security?.unprivilegedUser || "semantiq-agent",
        dropCapabilities: ["ALL"]
      },
      initialFilesystem
    };

    // 4. Compute SpecHash
    const specHash = computeSpecHash(environmentSpec);

    return {
      environmentSpec,
      specHash,
      initialRootMerkleHash,
      compilationTimestamp: new Date().toISOString(),
      warnings: []
    };
  }
}
