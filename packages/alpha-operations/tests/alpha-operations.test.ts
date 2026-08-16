import { describe, expect, it } from "vitest";
import { consentOptions, feedbackTaxonomy, LocalAlphaOperationsRuntime } from "../src/index.js";

describe("Sprint 7 alpha operations runtime", () => {
  it("runs the controlled alpha learning journey", async () => {
    const runtime = new LocalAlphaOperationsRuntime();
    const result = await runtime.runSprint7Validation();

    expect(result.alphaValidation.validation.releaseable).toBe(true);
    expect(result.cohort.targetSize).toBe(18);
    expect(result.invitation.accepted).toBe(true);
    expect(result.consent.levels).toContain("Usability Session");
    expect(result.metrics.activatedTesters).toBe(1);
    expect(result.metrics.northStarRate).toBe(1);
    expect(result.usability.tasks).toHaveLength(1);
    expect(result.semantiqFeedback.perceivedClarity).toBe(3);
    expect(result.aiFeedback.userControlAction).toBe("edited");
    expect(result.issue.status).toBe("Resolved");
    expect(result.experiment.result).toBe("Success");
    expect(result.decision.decision).toContain("uncertainty-first");
    expect(result.update.rollbackReady).toBe(true);
    expect(result.beta.decision).toBe("Ready with Conditions");
  });

  it("enforces granular consent before behavioral instrumentation", () => {
    const runtime = new LocalAlphaOperationsRuntime();
    const cohort = runtime.createAlphaCohort("Ring 0", 3, ["Developer"]);
    const invitation = runtime.acceptAlphaInvitation(runtime.createAlphaInvitation(cohort.id, "Developer", "developer").id);

    expect(invitation.tokenHash).not.toContain(cohort.id);
    expect(() => runtime.recordProductEvent("WorkspaceCreated", "tester:0", cohort.id, "created")).toThrow("explicit research consent");

    const consent = runtime.updateConsent("tester:0", ["Basic Anonymous Metrics"], true);
    expect(runtime.recordProductEvent("WorkspaceCreated", "tester:0", cohort.id, "created").privateContentIncluded).toBe(false);
    expect(runtime.withdrawConsent(consent.id).withdrawn).toBe(true);
    expect(runtime.exportConsentHistory("tester:0").length).toBeGreaterThanOrEqual(2);
  });

  it("supports feedback triage, experiments, release channels, update safety and beta readiness", () => {
    const runtime = new LocalAlphaOperationsRuntime();
    const feedback = runtime.submitContextualFeedback("Question Editor", "Question Intelligence", "High", "Suggestion comparison was unclear.");
    const issue = runtime.linkFeedbackToIssue(feedback.id, "S7-QI", "ux-lead");
    const experiment = runtime.createProductExperiment("EXP-S7-002", "Do examples help first question creation?", "Examples reduce empty-state confusion.", ["Curious non-technical user"], "A/B moderated observation", ["task completion"], "80% draft question", "50% abandon", "Anonymous metrics only", "1 week", "ux-lead");
    const channel = runtime.publishReleaseChannel("Alpha Candidate", "0.1.1-alpha.2");
    const update = runtime.verifyUpdatePackage("alpha-0.1.1-alpha.2.zip");
    const beta = runtime.runBetaReadinessAssessment();

    expect(runtime.updateFeedbackStatus(issue.id, "Resolved").status).toBe("Resolved");
    expect(runtime.startExperiment(experiment.id).result).toBe("Running");
    expect(runtime.completeExperiment(experiment.id, "Inconclusive", "Repeat with larger sample.").decision).toContain("Repeat");
    expect(channel.rollbackPath).toContain("restore");
    expect(runtime.rollbackReleaseChannel("Alpha Candidate").version).toBe("0.1.1-alpha.2");
    expect(update.automaticBackupId).toContain("backup:");
    expect(beta.unresolvedBlockers).toHaveLength(0);
    expect(feedbackTaxonomy).toContain("Concept confusion");
    expect(consentOptions).toContain("Screen Recording");
  });
});
