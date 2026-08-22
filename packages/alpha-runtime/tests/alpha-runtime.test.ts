import { describe, expect, it } from "vitest";
import {
  alphaApiContracts,
  alphaDeploymentProfiles,
  alphaDocumentationSections,
  alphaOnboardingSteps,
  LocalAlphaRuntime,
  publicAlphaScopeItems
} from "../src/index.js";

describe("Public Alpha runtime", () => {
  it("runs the full Public Alpha validation journey", async () => {
    const runtime = new LocalAlphaRuntime();
    const result = await runtime.runPublicAlphaValidation();

    expect(result.scope.included).toEqual(
      expect.arrayContaining([
        "Local identity",
        "Feedback submission",
        "Invitation-only federation"
      ])
    );
    expect(result.localJourney).toHaveLength(20);
    expect(result.federationJourney.remoteReference.revoked).toBe(true);
    expect(result.safetyJourney).toEqual(
      expect.arrayContaining([
        "safe-mode-enabled",
        "external-provider-call-blocked",
        "federation-share-blocked"
      ])
    );
    expect(result.backup.portable).toBe(true);
    expect(result.restore.validation).toBe("pass");
    expect(result.diagnostics.redacted).toBe(true);
    expect(result.feedback.status).toBe("Submitted");
    expect(result.validation.releaseable).toBe(true);
    expect(result.release.version).toBe("0.1.0-alpha.2");
    expect(result.health.telemetryStatus).toBe("disabled");
  });

  it("enforces conservative flags, Safe Mode and consent-controlled diagnostics", () => {
    const runtime = new LocalAlphaRuntime();

    expect(runtime.getFeatureFlags().find((flag) => flag.name === "remoteAIEnabled")?.enabled).toBe(
      false
    );
    expect(
      runtime.getFeatureFlags().find((flag) => flag.name === "telemetryEnabled")?.enabled
    ).toBe(false);
    runtime.enableSafeMode("tester");
    expect(
      runtime.getFeatureFlags().find((flag) => flag.name === "federationEnabled")?.enabled
    ).toBe(false);
    expect(
      runtime.getFeatureFlags().find((flag) => flag.name === "pluginExecutionEnabled")?.enabled
    ).toBe(false);

    const bundle = runtime.createDiagnosticBundle("tester");
    const redacted = runtime.redactDiagnosticBundle(bundle.id);
    expect(redacted.contents.token).toBe("[redacted]");
    expect(() =>
      runtime.submitFeedback({
        category: "Bug report",
        severity: "Medium",
        reproductionSteps: ["step"],
        diagnosticBundleId: redacted.id,
        consentStatus: "remote-consented"
      })
    ).toThrow("requires diagnostics consent");
    runtime.grantConsent("tester", "diagnostics", true, "checkbox");
    expect(
      runtime.submitFeedback({
        category: "Bug report",
        severity: "Medium",
        reproductionSteps: ["step"],
        diagnosticBundleId: redacted.id,
        consentStatus: "remote-consented"
      }).status
    ).toBe("Submitted");
  });

  it("exposes compliance, backup, limitation, release and documentation contracts", () => {
    const runtime = new LocalAlphaRuntime();
    const backup = runtime.createBackup("workspace:test", "workspace", true);
    const dashboard = runtime.getComplianceDashboard();
    const exportData = runtime.exportUserData("user:test");
    const incident = runtime.reportIncident("Security incident", "High");
    const validation = runtime.runReleaseValidation();

    expect(runtime.verifyBackup(backup.id).valid).toBe(true);
    expect(runtime.restoreBackup(backup.id).validation).toBe("pass");
    expect(dashboard.aiFeatures.map((item) => item.id)).toContain("ai:semantiq");
    expect(exportData.subjectId).toBe("user:test");
    expect(runtime.listKnownLimitations().some((item) => item.publicVisibility)).toBe(true);
    expect(runtime.acknowledgeLimitation("limitation:ai").acknowledged).toBe(true);
    expect(incident.runbook).toContain("Security incident");
    expect(validation.gates.securityScan).toBe("pass");
    expect(publicAlphaScopeItems).toContain("Question Intelligence");
    expect(alphaOnboardingSteps).toContain("Run Semantiq");
    expect(alphaDeploymentProfiles).toContain("Safe Mode alpha");
    expect(alphaDocumentationSections).toContain("Known limitations");
    expect(alphaApiContracts.release).toContain("runReleaseValidation()");
  });
});
