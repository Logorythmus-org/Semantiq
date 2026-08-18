/**
 * @package @tech-club/adapter-opensandbox
 * OpenSandbox Adapter Implementation
 */

import {
  BaseSandboxAdapter,
  type EnvironmentSpec,
  type SandboxCapabilities,
  type ProviderHealthStatus,
  type ISandboxInstance
} from "../../sandbox-contracts/src/index.js";
import { OpenSandboxProtocolClient } from "./opensandbox-client.js";
import { OpenSandboxInstance } from "./opensandbox-instance.js";
import type { OpenSandboxConfig } from "./types.js";

export class OpenSandboxAdapter extends BaseSandboxAdapter {
  readonly providerId = "opensandbox";
  readonly providerVersion = "1.0.0";

  private readonly client: OpenSandboxProtocolClient;

  constructor(config: OpenSandboxConfig) {
    super();
    this.client = new OpenSandboxProtocolClient(config);
  }

  async getCapabilities(): Promise<SandboxCapabilities> {
    const info = await this.client.getDaemonInfo();
    return {
      supportsSnapshots: info.engineCapabilities.snapshots,
      supportsFilesystemDiff: info.engineCapabilities.fsDiff,
      supportsLiveStream: true,
      supportsMicroVM: ["firecracker", "kata", "gvisor"].includes(info.backendEngine),
      supportsNetworkPolicy: true,
      supportsResourceHardening: true,
      maxExecutionTimeoutSeconds: 3600,
      supportedArchitectures: info.supportedArchitectures
    };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    try {
      const info = await this.client.getDaemonInfo();
      return {
        providerId: this.providerId,
        isHealthy: true,
        latencyMs: 5,
        details: { backend: info.backendEngine, version: info.version }
      };
    } catch (err: any) {
      return {
        providerId: this.providerId,
        isHealthy: false,
        latencyMs: -1,
        details: { error: err.message }
      };
    }
  }

  async createSandbox(spec: EnvironmentSpec): Promise<ISandboxInstance> {
    const validation = await this.validateEnvironmentSpec(spec);
    if (!validation.isValid) {
      throw new Error(`EnvironmentSpec validation failed: ${validation.errors.join(", ")}`);
    }

    const wireRequest = {
      image: `${spec.image.name}@${spec.image.digest}`,
      env: spec.environmentVariables ? { ...spec.environmentVariables } : undefined,
      workingDir: spec.workingDirectory,
      resources: {
        cpuCores: spec.resources.cpuLimitCores,
        memoryMb: spec.resources.memoryLimitMebibytes,
        diskMb: spec.resources.diskLimitMebibytes,
        pidsMax: spec.resources.maxProcessCount
      },
      security: {
        networkMode: spec.security.networkMode,
        allowedEgressHosts: spec.security.whitelistedHosts,
        readOnlyRoot: spec.security.readOnlyRootFilesystem,
        unprivilegedUser: spec.security.unprivilegedUser
      }
    };

    const res = await this.client.createSandbox(wireRequest);
    const instance = new OpenSandboxInstance(
      res.sandboxId,
      this.client,
      spec,
      this.providerVersion
    );

    if (spec.initialFilesystem && spec.initialFilesystem.length > 0) {
      await this.client.uploadFiles(
        res.sandboxId,
        spec.initialFilesystem.map((f) => ({ path: f.path, contentBase64: f.contentBase64 }))
      );
    }

    return instance;
  }
}
