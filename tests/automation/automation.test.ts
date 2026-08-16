import { describe, expect, it } from "vitest";
import {
  AutonomousEngineeringEngine,
  engineeringAgents,
  type FeatureGoal,
  type RepositoryInventory
} from "../../tools/automation/src/index.js";

const goal: FeatureGoal = {
  id: "TC-106",
  title: "Add Engineering Automation",
  summary: "Generate Spec-Kit, tasks, tests, docs, review notes, and release plans.",
  owner: "platform",
  packageHint: "tools/automation",
  acceptance: ["Spec-Kit is generated", "Tasks have stable IDs", "Review pipeline reports findings"]
};

const inventory: RepositoryInventory = {
  packages: ["core", "mvp-runtime", "agent-runtime"],
  services: ["api", "gateway"],
  apps: ["web"],
  docs: ["CORE_DOMAIN.md", "MVP_INTEGRATION.md"],
  tests: ["core-domain.test.ts", "mvp-journey.test.ts"],
  dependencies: ["typescript@5.7.3"]
};

describe("autonomous engineering automation", () => {
  it("generates complete Spec-Kit files and stable tasks", () => {
    const engine = new AutonomousEngineeringEngine();
    const spec = engine.generateSpecKit(goal);
    const tasks = engine.generateTasks(goal);

    expect(Object.keys(spec.files)).toEqual([
      "spec.md",
      "contracts.md",
      "tasks.md",
      "tests.md",
      "acceptance.md",
      "api.md",
      "adr.md",
      "benchmark.md",
      "changelog.md",
      "release.md"
    ]);
    expect(tasks.map((task) => task.id)).toContain("TC-106.1.1.5");
    expect(spec.requiredReviews).toContain("architecture-guardian");
  });

  it("analyzes repository health and creates dashboard snapshots", () => {
    const engine = new AutonomousEngineeringEngine();
    const report = engine.analyzeRepository(inventory);
    const dashboard = engine.dashboard(inventory, "passing");

    expect(report.packageCount).toBe(3);
    expect(report.missingDocs).toContain("agent-runtime");
    expect(dashboard.buildStatus).toBe("passing");
    expect(dashboard.sprintProgress).toBe(100);
  });

  it("generates review, test, documentation, and release automation outputs", () => {
    const engine = new AutonomousEngineeringEngine();
    const findings = engine.reviewChange(["packages/example/src/index.ts"]);
    const tests = engine.generateTestPlan(goal);
    const docs = engine.generateDocumentationPlan(goal);
    const release = engine.planRelease("0.1.0-alpha", [goal]);

    expect(findings.map((finding) => finding.area)).toContain("testing");
    expect(tests).toContain("Integration tests");
    expect(docs).toContain("README updates");
    expect(release.artifacts).toContain("Test report");
    expect(engineeringAgents).toContain("security-agent");
  });
});
