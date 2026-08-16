import { describe, expect, it } from "vitest";
import {
  assetPackageLayout,
  LocalSprint4Runtime,
  marketplaceScreens,
  sprint4ApiContracts,
  sprint4CliCommands
} from "../src/index.js";

describe("Sprint 4 semantic marketplace runtime", () => {
  it("runs the critical local asset lifecycle end to end", async () => {
    const runtime = new LocalSprint4Runtime();
    const result = await runtime.runCriticalAssetLifecycle();

    expect(result.asset.type).toBe("Workflow Template");
    expect(result.asset.state).toBe("Published");
    expect(result.asset.knowledgeObjectId).toContain("knowledge:");
    expect(result.package.layout).toEqual(
      expect.arrayContaining(["manifest.json", "README.md", "LICENSE", "semantiq/report.json"])
    );
    expect(result.package.manifest.packageVersion).toBe("techclub-asset-v1");
    expect(result.validation).toHaveLength(12);
    expect(result.validation.map((item) => item.stage)).toContain("Security Scan");
    expect(result.semantiq.scores.map((score) => score.dimension)).toEqual(
      expect.arrayContaining(["Clarity", "Documentation quality", "Reusability", "Approval design"])
    );
    expect(result.listing.trustIndicators).toContain("human-approved");
    expect(result.installationPlan.mutatesEnvironment).toBe(false);
    expect(result.installationPlan.permissions).toEqual(
      expect.arrayContaining(["workspace:read", "graph:write"])
    );
    expect(result.installation.state).toBe("Installed");
    expect(result.review.explanation).toContain("Structured local review");
    expect(result.updatedAsset.version).toBe("1.0.1");
    expect(result.rollback.state).toBe("Rollback Available");
    expect(result.exportPackage.assetId).toBe(result.asset.id);
    expect(result.wallet.createdAssets).toContain(result.asset.id);
    expect(result.wallet.publishedAssets).toContain(result.asset.id);
    expect(result.wallet.installedAssets).toContain(result.asset.id);
  });

  it("emits required marketplace lifecycle events", async () => {
    const runtime = new LocalSprint4Runtime();
    const result = await runtime.runCriticalAssetLifecycle();
    const eventTypes = result.events.map((event) => event.type);

    for (const required of [
      "AssetCreated",
      "AssetPackaged",
      "AssetValidationStarted",
      "AssetValidationCompleted",
      "AssetReviewRequested",
      "AssetApproved",
      "AssetPublished",
      "AssetInstalled",
      "AssetUpdated",
      "AssetRolledBack",
      "LicenseGranted",
      "WorkflowTemplateRegistered",
      "MarketplaceReviewSubmitted"
    ] as const) {
      expect(eventTypes).toContain(required);
    }
    expect(
      result.events.every(
        (event) =>
          event.eventVersion === 1 &&
          event.actorId &&
          event.assetId &&
          event.audit.localFirst === true
      )
    ).toBe(true);
  });

  it("supports package verification, plugin sandbox, SDK descriptors, moderation, search and CLI/API contracts", async () => {
    const runtime = new LocalSprint4Runtime();
    const result = await runtime.runCriticalAssetLifecycle();
    const verification = runtime.verifyPackage(result.package.id);
    const plugin = runtime.registerPlugin("identity:sprint4", result.asset.id);
    runtime.registerAgentPackage("identity:sprint4", result.asset.id);
    const sdk = runtime.generateSDK("typescript");
    const moderation = runtime.reportAsset(
      "identity:sprint4",
      result.asset.id,
      "Request changes",
      "Clarify sandbox guarantees."
    );
    const search = runtime.searchAssets("workflow evidence", { localOnly: true });
    const uninstalled = runtime.uninstallAsset("identity:sprint4", result.installation.id);

    expect(verification.checksumValidation).toBe("Passed");
    expect(verification.unsignedAllowedInLocalMode).toBe(true);
    expect(plugin.sandbox.networkPolicy).toBe("deny-by-default");
    expect(plugin.sandbox.disableSwitch).toBe(true);
    expect(sdk.modules).toContain("marketplace");
    expect(moderation.audited).toBe(true);
    expect(search.map((listing) => listing.assetId)).toContain(result.asset.id);
    expect(uninstalled.state).toBe("Uninstalled");
    expect(assetPackageLayout).toContain("signatures/");
    expect(marketplaceScreens).toContain("Installation Plan");
    expect(sprint4CliCommands).toContain("techclub asset validate");
    expect(sprint4ApiContracts.marketplace).toContain("searchAssets()");
  });
});
