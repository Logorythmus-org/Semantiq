import { describe, it, expect } from "vitest";
import {
  LicensingBoundaryAuditor,
  type ProviderLicensingManifest
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Provider Licensing Boundary", () => {
  const auditor = new LicensingBoundaryAuditor();

  const permissiveManifest: ProviderLicensingManifest = {
    providerId: "provider-docker-ce",
    runtimeName: "Docker Engine Community Edition",
    runtimeLicenseSpdx: "Apache-2.0",
    runtimeClassification: "PERMISSIVE",
    adapterLicenseSpdx: "MIT",
    isolationMechanism: "PROCESS_CLI_SUBPROCESS",
    isCleanRoomImplementation: true,
    allowsRedistribution: true,
    requiresAttributionNotice: true,
    thirdPartyNotices: [
      {
        componentName: "moby/moby",
        spdxId: "Apache-2.0",
        copyrightHolder: "Docker, Inc.",
        sourceUrl: "https://github.com/moby/moby"
      }
    ],
    registeredAt: "2026-08-15T12:00:00Z"
  };

  const copyleftNetworkManifest: ProviderLicensingManifest = {
    providerId: "provider-agpl-runtime",
    runtimeName: "AGPL Isolated Execution Daemon",
    runtimeLicenseSpdx: "AGPL-3.0-only",
    runtimeClassification: "NETWORK_COPYLEFT",
    adapterLicenseSpdx: "MIT",
    isolationMechanism: "NETWORK_RPC_GRPC",
    isCleanRoomImplementation: true,
    allowsRedistribution: false,
    requiresAttributionNotice: true,
    thirdPartyNotices: [
      {
        componentName: "agpl-daemon-core",
        spdxId: "AGPL-3.0-only",
        copyrightHolder: "Open Consortium",
        sourceUrl: "https://example.org/agpl-daemon"
      }
    ],
    registeredAt: "2026-08-15T12:00:00Z"
  };

  const commercialProprietaryManifest: ProviderLicensingManifest = {
    providerId: "provider-e2b-cloud",
    runtimeName: "E2B MicroVM Cloud Runtime",
    runtimeLicenseSpdx: "Proprietary",
    runtimeClassification: "COMMERCIAL_PROPRIETARY",
    adapterLicenseSpdx: "Apache-2.0",
    isolationMechanism: "NETWORK_RPC_REST",
    isCleanRoomImplementation: true,
    allowsRedistribution: false,
    requiresAttributionNotice: true,
    trademarkGuidelinesUrl: "https://e2b.dev/brand",
    thirdPartyNotices: [
      {
        componentName: "@e2b/sdk",
        spdxId: "Apache-2.0",
        copyrightHolder: "E2B Inc",
        sourceUrl: "https://github.com/e2b-dev/e2b"
      }
    ],
    registeredAt: "2026-08-15T12:00:00Z"
  };

  it("audits permissive open-source runtime manifest successfully", () => {
    const report = auditor.auditManifest(permissiveManifest);
    expect(report.isCompliant).toBe(true);
    expect(report.isCleanRoomIsolated).toBe(true);
    expect(report.hasNoCoreContamination).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it("verifies network copyleft runtime isolation across gRPC boundary with audit warnings", () => {
    const report = auditor.auditManifest(copyleftNetworkManifest);
    expect(report.isCompliant).toBe(true);
    expect(report.isCleanRoomIsolated).toBe(true);
    expect(
      report.warnings.some((w) => w.includes("Copyleft runtime (AGPL-3.0-only) detected"))
    ).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it("audits commercial proprietary provider manifest and checks trademark guidelines", () => {
    const report = auditor.auditManifest(commercialProprietaryManifest);
    expect(report.isCompliant).toBe(true);
    expect(report.isCleanRoomIsolated).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it("flags non-clean-room implementation and missing attribution notices", () => {
    const invalidManifest: ProviderLicensingManifest = {
      ...permissiveManifest,
      providerId: "invalid-provider",
      isCleanRoomImplementation: false,
      requiresAttributionNotice: true,
      thirdPartyNotices: []
    };

    const report = auditor.auditManifest(invalidManifest);
    expect(report.isCompliant).toBe(false);
    expect(report.isCleanRoomIsolated).toBe(false);
    expect(report.violations).toContain(
      "Runtime adapter is not declared as a clean-room implementation."
    );
    expect(report.violations).toContain(
      "Attribution notice is required by license but no third-party notice entries were provided."
    );
  });

  it("generates structured attribution notice bundle for legal compliance", () => {
    const bundle = auditor.generateAttributionNoticeBundle([
      permissiveManifest,
      commercialProprietaryManifest
    ]);

    expect(bundle).toContain("# SemantIQ Third-Party Runtime & Provider Attribution Notices");
    expect(bundle).toContain("Docker Engine Community Edition");
    expect(bundle).toContain("E2B MicroVM Cloud Runtime");
    expect(bundle).toContain("moby/moby [Apache-2.0] © Docker, Inc.");
    expect(bundle).toContain("@e2b/sdk [Apache-2.0] © E2B Inc");
  });
});
