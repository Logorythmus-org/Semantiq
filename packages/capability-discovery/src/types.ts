/**
 * @package @semantiq/capability-discovery
 * Capability Taxonomy & Manifest Types
 */

export interface ProviderCapabilitiesManifest {
  readonly manifestVersion: "1.0.0";
  readonly providerId: string;
  readonly providerVersion: string;
  readonly probedAt: string;

  readonly isolation: {
    readonly tier: "HARDWARE_MICROVM" | "CONTAINER_JAIL" | "ROOTLESS_OCI" | "MOCK_REPLAY";
    readonly mechanism: string;
    readonly rootless: boolean;
    readonly seccompHardened: boolean;
  };

  readonly compute: {
    readonly maxCpuCores: number;
    readonly maxMemoryMb: number;
    readonly maxDiskMb: number;
    readonly maxConcurrentSandboxes: number;
    readonly typicalColdBootLatencyMs: number;
    readonly typicalWarmBootLatencyMs: number;
  };

  readonly hardwareAcceleration: {
    readonly cudaGpuAvailable: boolean;
    readonly gpuModel?: string;
    readonly gpuMemoryMb?: number;
    readonly webGpuAvailable: boolean;
  };

  readonly browserAutomation: {
    readonly supported: boolean;
    readonly engines: readonly ("chromium" | "firefox" | "webkit")[];
    readonly cdpProtocolSupported: boolean;
    readonly vncScreenStreamSupported?: boolean;
  };

  readonly mcpBridging: {
    readonly supported: boolean;
    readonly transports: readonly ("stdio" | "sse" | "http")[];
  };

  readonly stateManagement: {
    readonly nativeSnapshots: boolean;
    readonly snapshotLatencyMs?: number;
    readonly filesystemMerkleDiff: boolean;
    readonly treeBranching?: boolean;
  };

  readonly network: {
    readonly isolatedNone: boolean;
    readonly egressWhitelist: boolean;
    readonly dnsAuditing?: boolean;
  };
}

export interface CapabilityNegotiationResult {
  readonly isCompatible: boolean;
  readonly selectedProviderId: string;
  readonly missingMandatoryFeatures: readonly string[];
  readonly activeFallbacks: readonly {
    readonly feature: string;
    readonly fallbackMechanism: string;
  }[];
}
