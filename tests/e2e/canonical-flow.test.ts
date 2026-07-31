import { describe, expect, it } from "vitest";
import { FirstRunDoctor } from "../../packages/diagnostics/src/index.js";
import { LocalSemantiqEngine } from "../../packages/semantiq/src/index.js";

describe("Canonical User Journey E2E Test", () => {
  const doctor = new FirstRunDoctor();
  const engine = new LocalSemantiqEngine();

  it("executes canonical flow: doctor -> connector -> preflight -> smoke -> benchmark -> export -> reproduce", async () => {
    // 1. Doctor
    const doctorReport = doctor.runDoctor();
    expect(doctorReport.overallStatus).not.toBe("failing");

    // 2. Connector
    const connectors = doctor.getConnectors();
    const readyConnectors = connectors.filter((c) => c.status === "ready" || c.status === "configured");
    expect(readyConnectors.length).toBeGreaterThan(0);

    // 3. Preflight
    expect(doctorReport.checks.some((c) => c.id === "local-connector" && c.status === "pass")).toBe(true);

    // 4. Smoke & Benchmark Evaluation
    const subject = {
      id: "canonical_e2e_001",
      kind: "question" as const,
      version: "1.0.0",
      title: "Canonical E2E Question",
      content: "Evaluating canonical user journey flow.",
      contextIds: [],
      evidenceIds: ["ev_e2e"]
    };
    const profile = {
      id: "profile_canonical",
      version: "1.0.0",
      name: "Canonical Profile",
      weights: { "question-quality": 1.0 }
    };

    const report = await engine.evaluate(subject, profile);
    expect(report.id).toBeDefined();
    expect(report.weightedScore).toBeGreaterThan(0);

    // 5. Inspect Evidence & Explanation
    const explanation = await engine.explain(report.id);
    expect(explanation).toContain("question-quality");

    // 6. Export Report (JSON & Markdown)
    const jsonExport = await engine.exportReport(report.id, "json");
    expect(jsonExport).toContain(report.id);
    const mdExport = await engine.exportReport(report.id, "markdown");
    expect(mdExport).toContain("Semantiq Report");

    // 7. Reproduce Results
    const reproReport = await engine.evaluate(subject, profile);
    expect(reproReport.weightedScore).toEqual(report.weightedScore);
  });
});
