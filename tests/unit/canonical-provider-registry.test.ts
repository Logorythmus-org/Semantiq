import { describe, it, expect } from "vitest";
import {
  CanonicalProviderRegistry,
  type CanonicalProviderRegistryEntry,
  type SandboxCapabilities
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Canonical Provider Registry", () => {
  const registry = new CanonicalProviderRegistry();

  const standardCaps: SandboxCapabilities = {
    supportsSnapshots: true,
    supportsFilesystemDiff: true,
    supportsLiveStream: true,
    supportsMicroVM: true,
    supportsNetworkPolicy: true,
    supportsResourceHardening: true,
    maxExecutionTimeoutSeconds: 1800,
    supportedArchitectures: ["x86_64", "aarch64"]
  };

  const sampleLocalEntry: CanonicalProviderRegistryEntry = {
    providerId: "provider-docker-local",
    displayName: "Local Docker Daemon",
    organization: "SemantIQ Open Source",
    version: "24.0.7",
    releaseChannel: "STABLE",
    deploymentMode: "LOCAL_DAEMON",
    endpoints: {
      primaryUrl: "unix:///var/run/docker.sock",
      transport: "LOCAL_SOCKET",
      healthCheckUrl: "http://localhost/_ping",
      timeoutMs: 5000
    },
    capabilities: {
      ...standardCaps,
      supportsMicroVM: false
    },
    licensing: {
      providerId: "provider-docker-local",
      runtimeName: "Docker CE",
      runtimeLicenseSpdx: "Apache-2.0",
      runtimeClassification: "PERMISSIVE",
      adapterLicenseSpdx: "MIT",
      isolationMechanism: "OCI_STANDARD_API",
      isCleanRoomImplementation: true,
      allowsRedistribution: true,
      requiresAttributionNotice: true,
      thirdPartyNotices: [
        { componentName: "moby", spdxId: "Apache-2.0", copyrightHolder: "Docker Inc" }
      ],
      registeredAt: "2026-08-15T12:00:00Z"
    },
    trustTier: "TCK_VERIFIED",
    securityGrade: "B_ISOLATED_CONTAINER",
    pricing: {
      tier: "COMMUNITY_FREE",
      unit: "SECOND",
      baseUnitPrice: 0,
      currency: "NONE",
      minBillingIncrementSec: 0,
      egressCostPerGb: 0,
      coldBootSurcharge: 0,
      idleReservationCostPerMin: 0
    },
    sla: {
      uptimePercentage: 100.0,
      p50ColdBootLatencyMs: 1200,
      p95ColdBootLatencyMs: 2500,
      maxConcurrentSandboxes: 8
    },
    status: "ONLINE",
    consecutiveFailures: 0,
    tags: ["local", "docker", "offline-ready"],
    registeredAt: "2026-08-15T12:00:00Z",
    lastHeartbeatAt: "2026-08-15T12:00:00Z",
    signatureHex:
      "3045022100regentry0123456789abcdef0123456789abcdef0123456789abcdef0220regentry0123456789abcdef0123456789abcdef0123456789abcdef"
  };

  const sampleCloudEntry: CanonicalProviderRegistryEntry = {
    providerId: "provider-e2b-cloud",
    displayName: "E2B MicroVM Cloud",
    organization: "E2B Inc",
    version: "1.2.0",
    releaseChannel: "STABLE",
    deploymentMode: "MANAGED_MULTI_TENANT",
    endpoints: {
      primaryUrl: "https://api.e2b.dev",
      backupUrls: ["https://api-backup.e2b.dev"],
      transport: "HTTP_REST",
      healthCheckUrl: "https://api.e2b.dev/health",
      timeoutMs: 10000
    },
    capabilities: standardCaps,
    licensing: {
      providerId: "provider-e2b-cloud",
      runtimeName: "E2B Cloud Runtime",
      runtimeLicenseSpdx: "Proprietary",
      runtimeClassification: "COMMERCIAL_PROPRIETARY",
      adapterLicenseSpdx: "Apache-2.0",
      isolationMechanism: "NETWORK_RPC_REST",
      isCleanRoomImplementation: true,
      allowsRedistribution: false,
      requiresAttributionNotice: true,
      thirdPartyNotices: [
        { componentName: "@e2b/sdk", spdxId: "Apache-2.0", copyrightHolder: "E2B Inc" }
      ],
      registeredAt: "2026-08-15T12:00:00Z"
    },
    trustTier: "CRYPTOGRAPHICALLY_CERTIFIED",
    securityGrade: "A_HARDENED_MICROVM",
    pricing: {
      tier: "COMMERCIAL_PAYG",
      unit: "SECOND",
      baseUnitPrice: 0.00015,
      currency: "USD",
      minBillingIncrementSec: 5,
      egressCostPerGb: 0.05,
      coldBootSurcharge: 0.005,
      idleReservationCostPerMin: 0.002
    },
    sla: {
      uptimePercentage: 99.99,
      p50ColdBootLatencyMs: 250,
      p95ColdBootLatencyMs: 600,
      maxConcurrentSandboxes: 128
    },
    status: "ONLINE",
    consecutiveFailures: 0,
    tags: ["cloud", "microvm", "fast-boot"],
    registeredAt: "2026-08-15T12:00:00Z",
    lastHeartbeatAt: "2026-08-15T12:00:00Z",
    signatureHex:
      "3045022100e2breg0123456789abcdef0123456789abcdef0123456789abcdef0220e2breg0123456789abcdef0123456789abcdef0123456789abcdef"
  };

  it("registers valid canonical provider entries and records lifecycle events", () => {
    const report1 = registry.register(sampleLocalEntry);
    const report2 = registry.register(sampleCloudEntry);

    expect(report1.isSuccess).toBe(true);
    expect(report1.entrySha256).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(report2.isSuccess).toBe(true);
    expect(registry.listEntries().length).toBe(2);

    const events = registry.getEventLog();
    expect(events.filter((e) => e.eventType === "REGISTERED").length).toBe(2);
  });

  it("rejects entries with missing mandatory fields or invalid signatures", () => {
    const invalidEntry: CanonicalProviderRegistryEntry = {
      ...sampleLocalEntry,
      providerId: "",
      signatureHex: "too-short"
    };

    const report = registry.register(invalidEntry);
    expect(report.isSuccess).toBe(false);
    expect(report.violations).toContain("Provider ID is missing.");
    expect(report.violations).toContain("Cryptographic signature is missing or malformed.");
  });

  it("updates operational health status and emits STATUS_CHANGED event", () => {
    const updated = registry.updateHealth("provider-docker-local", "DEGRADED", 2);
    expect(updated).toBe(true);

    const entry = registry.getEntry("provider-docker-local");
    expect(entry?.status).toBe("DEGRADED");
    expect(entry?.consecutiveFailures).toBe(2);

    const events = registry.getEventLog();
    expect(
      events.some((e) => e.eventType === "STATUS_CHANGED" && e.currentStatus === "DEGRADED")
    ).toBe(true);
  });

  it("filters canonical entries by deployment mode, trust tier, and latency ceilings", () => {
    // Reset status back to ONLINE for test
    registry.updateHealth("provider-docker-local", "ONLINE", 0);

    const cloudOnly = registry.find({ allowedDeploymentModes: ["MANAGED_MULTI_TENANT"] });
    expect(cloudOnly.length).toBe(1);
    expect(cloudOnly[0]?.providerId).toBe("provider-e2b-cloud");

    const offlineOnly = registry.find({ offlineOnly: true });
    expect(offlineOnly.length).toBe(1);
    expect(offlineOnly[0]?.providerId).toBe("provider-docker-local");

    const fastBootOnly = registry.find({ maxColdBootLatencyMs: 500 });
    expect(fastBootOnly.length).toBe(1);
    expect(fastBootOnly[0]?.providerId).toBe("provider-e2b-cloud");
  });

  it("deregisters provider entries and records DEREGISTERED event", () => {
    expect(registry.deregister("provider-docker-local")).toBe(true);
    expect(registry.getEntry("provider-docker-local")).toBeUndefined();
    expect(registry.listEntries().length).toBe(1);

    const events = registry.getEventLog();
    expect(events.some((e) => e.eventType === "DEREGISTERED")).toBe(true);
  });
});
