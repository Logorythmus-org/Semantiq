import { describe, it, expect } from "vitest";
import {
  ProviderRouterEngine,
  type CanonicalProviderRegistryEntry,
  type EnvironmentSpec
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Web & API Provider Router Architecture", () => {
  const router = new ProviderRouterEngine();

  const mockRegistry: CanonicalProviderRegistryEntry[] = [
    {
      providerId: "provider-docker-local",
      version: "1.0.0",
      displayName: "Docker Local Daemon",
      organization: "Local Community",
      releaseChannel: "STABLE",
      deploymentMode: "LOCAL_DAEMON",
      trustTier: "SELF_ATTESTED",
      securityGrade: "B_ISOLATED_CONTAINER",
      endpoints: {
        primaryUrl: "unix:///var/run/docker.sock",
        transport: "LOCAL_SOCKET",
        timeoutMs: 30000
      },
      capabilities: {
        supportsSnapshots: true,
        supportsFilesystemDiff: true,
        supportsLiveStream: true,
        supportsMicroVM: false,
        supportsNetworkPolicy: true,
        supportsResourceHardening: true,
        maxExecutionTimeoutSeconds: 3600,
        supportedArchitectures: ["x86_64", "aarch64"]
      },
      licensing: {
        providerId: "provider-docker-local",
        runtimeName: "Docker Local",
        runtimeLicenseSpdx: "Apache-2.0",
        runtimeClassification: "PERMISSIVE",
        adapterLicenseSpdx: "Apache-2.0",
        isolationMechanism: "SOCKET_IPC",
        isCleanRoomImplementation: true,
        allowsRedistribution: true,
        requiresAttributionNotice: false,
        thirdPartyNotices: [],
        registeredAt: "2026-08-15T12:00:00Z"
      },
      pricing: {
        tier: "COMMUNITY_FREE",
        unit: "MINUTE",
        baseUnitPrice: 0.0,
        currency: "USD",
        minBillingIncrementSec: 1,
        egressCostPerGb: 0.0,
        coldBootSurcharge: 0.0,
        idleReservationCostPerMin: 0.0
      },
      sla: {
        uptimePercentage: 99.9,
        p50ColdBootLatencyMs: 200,
        p95ColdBootLatencyMs: 500,
        maxConcurrentSandboxes: 4
      },
      status: "ONLINE",
      consecutiveFailures: 0,
      tags: ["local", "docker"],
      registeredAt: "2026-08-15T12:00:00Z",
      lastHeartbeatAt: "2026-08-15T12:00:00Z",
      signatureHex: "304502210011111111111111111111111111111111022011111111111111111111111111111111"
    },
    {
      providerId: "provider-modal-cloud",
      version: "2.1.0",
      displayName: "Modal Cloud Runtimes",
      organization: "Modal Labs",
      releaseChannel: "STABLE",
      deploymentMode: "MANAGED_MULTI_TENANT",
      trustTier: "CRYPTOGRAPHICALLY_CERTIFIED",
      securityGrade: "A_HARDENED_MICROVM",
      endpoints: {
        primaryUrl: "https://api.modal.com/v1",
        transport: "HTTP_REST",
        timeoutMs: 60000
      },
      capabilities: {
        supportsSnapshots: true,
        supportsFilesystemDiff: true,
        supportsLiveStream: true,
        supportsMicroVM: true,
        supportsNetworkPolicy: true,
        supportsResourceHardening: true,
        maxExecutionTimeoutSeconds: 7200,
        supportedArchitectures: ["x86_64"]
      },
      licensing: {
        providerId: "provider-modal-cloud",
        runtimeName: "Modal Cloud",
        runtimeLicenseSpdx: "Proprietary",
        runtimeClassification: "COMMERCIAL_PROPRIETARY",
        adapterLicenseSpdx: "Apache-2.0",
        isolationMechanism: "NETWORK_RPC_REST",
        isCleanRoomImplementation: true,
        allowsRedistribution: false,
        requiresAttributionNotice: true,
        thirdPartyNotices: [],
        registeredAt: "2026-08-15T12:00:00Z"
      },
      pricing: {
        tier: "COMMERCIAL_PAYG",
        unit: "MINUTE",
        baseUnitPrice: 0.05,
        currency: "USD",
        minBillingIncrementSec: 1,
        egressCostPerGb: 0.08,
        coldBootSurcharge: 0.001,
        idleReservationCostPerMin: 0.01
      },
      sla: {
        uptimePercentage: 99.99,
        p50ColdBootLatencyMs: 80,
        p95ColdBootLatencyMs: 150,
        maxConcurrentSandboxes: 100
      },
      status: "ONLINE",
      consecutiveFailures: 0,
      tags: ["cloud", "modal", "microvm"],
      registeredAt: "2026-08-15T12:00:00Z",
      lastHeartbeatAt: "2026-08-15T12:00:00Z",
      signatureHex: "304502210022222222222222222222222222222222022022222222222222222222222222222222"
    }
  ];

  const sampleEnv: EnvironmentSpec = {
    specVersion: "1.0.0",
    runtimeType: "container",
    image: {
      name: "python:3.11-slim",
      digest: "sha256:ba822f60cf6ae44304d8f1618793ed09ac3cb6bc8b5368d653c0b8dc7c2f0ad0"
    },
    workingDirectory: "/workspace",
    resources: {
      cpuLimitCores: 2,
      memoryLimitMebibytes: 2048,
      diskLimitMebibytes: 5120,
      maxExecutionTimeoutSeconds: 300
    },
    security: {
      networkMode: "none",
      readOnlyRootFilesystem: true
    }
  };

  it("selects lowest-cost primary and cloud fallback provider", () => {
    const decision = router.evaluateRouting("scenario-refactor-01", sampleEnv, mockRegistry, {});

    expect(decision.selectedProviderId).toBe("provider-docker-local");
    expect(decision.fallbackProviderId).toBe("provider-modal-cloud");
    expect(decision.decisionSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("enforces local-only policy and rejects commercial cloud endpoints", () => {
    const decision = router.evaluateRouting("scenario-refactor-01", sampleEnv, mockRegistry, {
      requireLocalOnly: true
    });

    expect(decision.selectedProviderId).toBe("provider-docker-local");
    expect(decision.fallbackProviderId).toBeUndefined();
    expect(
      decision.candidatesEvaluated.find((c) => c.providerId === "provider-modal-cloud")
        ?.policyCompliant
    ).toBe(false);
  });

  it("exports formatted Markdown routing audit report", () => {
    const decision = router.evaluateRouting("scenario-refactor-01", sampleEnv, mockRegistry, {});
    const markdown = router.exportRoutingMarkdown(decision);

    expect(markdown).toContain("# Routing Decision Record");
    expect(markdown).toContain("provider-docker-local");
    expect(markdown).toContain("Evaluated Provider Candidate Ranks");
    expect(markdown).toContain("Cryptographic Routing Signature");
  });
});
