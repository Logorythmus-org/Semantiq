/**
 * @package @semantiq/capability-discovery
 * Capability Discovery Service
 */

import type { ISandboxProvider, EnvironmentSpec } from "../../sandbox-contracts/src/index.js";
import type { ProviderCapabilitiesManifest, CapabilityNegotiationResult } from "./types.js";
import { CapabilityNegotiator } from "./negotiator.js";

export class CapabilityDiscoveryService {
  private readonly manifests: Map<string, ProviderCapabilitiesManifest> = new Map();
  private readonly negotiator = new CapabilityNegotiator();

  async registerProvider(provider: ISandboxProvider): Promise<ProviderCapabilitiesManifest> {
    const caps = await provider.getCapabilities();
    const manifest: ProviderCapabilitiesManifest = {
      manifestVersion: "1.0.0",
      providerId: provider.providerId,
      providerVersion: provider.providerVersion,
      probedAt: new Date().toISOString(),
      isolation: {
        tier: caps.supportsMicroVM ? "HARDWARE_MICROVM" : "ROOTLESS_OCI",
        mechanism: caps.supportsMicroVM ? "firecracker" : "runc",
        rootless: true,
        seccompHardened: true
      },
      compute: {
        maxCpuCores: 8,
        maxMemoryMb: 16384,
        maxDiskMb: 65536,
        maxConcurrentSandboxes: 16,
        typicalColdBootLatencyMs: caps.supportsMicroVM ? 250 : 1000,
        typicalWarmBootLatencyMs: 150
      },
      hardwareAcceleration: {
        cudaGpuAvailable: false,
        webGpuAvailable: false
      },
      browserAutomation: {
        supported: true,
        engines: ["chromium"],
        cdpProtocolSupported: true
      },
      mcpBridging: {
        supported: true,
        transports: ["stdio", "sse"]
      },
      stateManagement: {
        nativeSnapshots: caps.supportsSnapshots,
        filesystemMerkleDiff: caps.supportsFilesystemDiff
      },
      network: {
        isolatedNone: true,
        egressWhitelist: caps.supportsNetworkPolicy
      }
    };

    this.manifests.set(provider.providerId, manifest);
    return manifest;
  }

  getManifest(providerId: string): ProviderCapabilitiesManifest | undefined {
    return this.manifests.get(providerId);
  }

  listManifests(): readonly ProviderCapabilitiesManifest[] {
    return Array.from(this.manifests.values());
  }

  negotiate(spec: EnvironmentSpec): CapabilityNegotiationResult {
    return this.negotiator.negotiate(spec, this.listManifests());
  }
}
