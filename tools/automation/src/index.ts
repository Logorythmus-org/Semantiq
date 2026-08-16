export type AutomationAgentRole =
  | "spec-agent"
  | "planning-agent"
  | "repository-agent"
  | "implementation-agent"
  | "review-agent"
  | "testing-agent"
  | "documentation-agent"
  | "release-agent"
  | "security-agent"
  | "performance-agent"
  | "migration-agent"
  | "architecture-guardian";

export interface FeatureGoal {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly owner: string;
  readonly packageHint?: string;
  readonly acceptance: readonly string[];
}

export interface GeneratedSpecKit {
  readonly goal: FeatureGoal;
  readonly files: Readonly<Record<string, string>>;
  readonly requiredReviews: readonly AutomationAgentRole[];
}

export interface TaskNode {
  readonly id: string;
  readonly parentId?: string;
  readonly type: "epic" | "feature" | "story" | "task" | "subtask" | "acceptance-test" | "documentation" | "review";
  readonly title: string;
  readonly acceptance: readonly string[];
}

export interface RepositoryInventory {
  readonly packages: readonly string[];
  readonly services: readonly string[];
  readonly apps: readonly string[];
  readonly docs: readonly string[];
  readonly tests: readonly string[];
  readonly dependencies: readonly string[];
}

export interface RepositoryAnalysisReport {
  readonly packageCount: number;
  readonly serviceCount: number;
  readonly appCount: number;
  readonly missingDocs: readonly string[];
  readonly missingTests: readonly string[];
  readonly duplicateCandidates: readonly string[];
  readonly securityRisks: readonly string[];
  readonly recommendations: readonly string[];
}

export interface ReviewFinding {
  readonly id: string;
  readonly area:
    | "architecture"
    | "ddd"
    | "solid"
    | "performance"
    | "security"
    | "accessibility"
    | "documentation"
    | "testing"
    | "naming"
    | "complexity"
    | "openapi";
  readonly severity: "info" | "warning" | "blocker";
  readonly message: string;
}

export interface ReleasePlan {
  readonly version: string;
  readonly releaseNotes: string;
  readonly migrationGuide: string;
  readonly compatibilityMatrix: readonly string[];
  readonly artifacts: readonly string[];
}

export interface EngineeringDashboardSnapshot {
  readonly repositoryHealth: number;
  readonly packageHealth: number;
  readonly documentationHealth: number;
  readonly testingHealth: number;
  readonly securityHealth: number;
  readonly sprintProgress: number;
  readonly technicalDebt: readonly string[];
  readonly buildStatus: "passing" | "failing" | "unknown";
}

const specFiles = [
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
] as const;

export class AutonomousEngineeringEngine {
  generateSpecKit(goal: FeatureGoal): GeneratedSpecKit {
    const files = Object.fromEntries(specFiles.map((file) => [file, this.renderSpecFile(file, goal)]));
    return {
      goal,
      files,
      requiredReviews: [
        "architecture-guardian",
        "review-agent",
        "testing-agent",
        "documentation-agent",
        "security-agent",
        "performance-agent",
        "release-agent"
      ]
    };
  }

  generateTasks(goal: FeatureGoal): readonly TaskNode[] {
    const epicId = goal.id;
    const featureId = `${goal.id}.1`;
    const storyId = `${goal.id}.1.1`;
    return [
      { id: epicId, type: "epic", title: goal.title, acceptance: goal.acceptance },
      { id: featureId, parentId: epicId, type: "feature", title: `Implement ${goal.title}`, acceptance: goal.acceptance },
      { id: storyId, parentId: featureId, type: "story", title: goal.summary, acceptance: goal.acceptance },
      { id: `${storyId}.1`, parentId: storyId, type: "task", title: "Create or update Spec-Kit files", acceptance: ["Spec-Kit files exist"] },
      { id: `${storyId}.2`, parentId: storyId, type: "task", title: "Implement production slice", acceptance: goal.acceptance },
      { id: `${storyId}.3`, parentId: storyId, type: "acceptance-test", title: "Add acceptance tests", acceptance: ["Critical path test passes"] },
      { id: `${storyId}.4`, parentId: storyId, type: "documentation", title: "Update documentation", acceptance: ["Docs reflect code"] },
      { id: `${storyId}.5`, parentId: storyId, type: "review", title: "Run automated review", acceptance: ["No blocker findings"] }
    ];
  }

  analyzeRepository(inventory: RepositoryInventory): RepositoryAnalysisReport {
    const missingDocs = inventory.packages.filter((pkg) => !inventory.docs.some((doc) => doc.includes(pkg)));
    const missingTests = inventory.packages.filter((pkg) => !inventory.tests.some((test) => test.includes(pkg)));
    const duplicates = inventory.packages.filter((pkg, index) => inventory.packages.indexOf(pkg) !== index);
    const securityRisks = inventory.dependencies
      .filter((dependency) => dependency.includes("latest") || dependency.includes("*"))
      .map((dependency) => `Unpinned dependency: ${dependency}`);
    return {
      packageCount: inventory.packages.length,
      serviceCount: inventory.services.length,
      appCount: inventory.apps.length,
      missingDocs,
      missingTests,
      duplicateCandidates: [...new Set(duplicates)],
      securityRisks,
      recommendations: [
        "Keep Spec-Kit mandatory for new work.",
        "Prioritize missing package tests.",
        "Keep provider integrations behind adapters.",
        "Generate migration notes for API, event, and schema changes."
      ]
    };
  }

  reviewChange(changedFiles: readonly string[]): readonly ReviewFinding[] {
    const findings: ReviewFinding[] = [];
    if (!changedFiles.some((file) => file.includes("spec") || file.includes("Docs"))) {
      findings.push({
        id: "review:docs",
        area: "documentation",
        severity: "warning",
        message: "Change should include Spec-Kit or documentation updates."
      });
    }
    if (changedFiles.some((file) => file.endsWith(".ts")) && !changedFiles.some((file) => file.includes("test"))) {
      findings.push({
        id: "review:tests",
        area: "testing",
        severity: "warning",
        message: "TypeScript implementation changes should include tests."
      });
    }
    if (changedFiles.some((file) => file.includes("package.json"))) {
      findings.push({
        id: "review:supply-chain",
        area: "security",
        severity: "info",
        message: "Dependency or package metadata change requires supply-chain review."
      });
    }
    return findings;
  }

  generateTestPlan(goal: FeatureGoal): string {
    return [
      `# Test Plan: ${goal.title}`,
      "",
      "- Unit tests for domain behavior.",
      "- Integration tests for runtime wiring.",
      "- Contract tests for APIs/events/schemas.",
      "- Regression tests for previous sprint behavior.",
      "- Security tests for permissions and data boundaries.",
      "- Performance checks for declared benchmark targets.",
      "",
      "## Acceptance",
      ...goal.acceptance.map((item) => `- ${item}`)
    ].join("\n");
  }

  generateDocumentationPlan(goal: FeatureGoal): string {
    return [
      `# Documentation Plan: ${goal.title}`,
      "",
      "- README updates.",
      "- Architecture notes.",
      "- API reference updates.",
      "- Migration notes.",
      "- Changelog entry.",
      "- Known limitations.",
      "- Examples."
    ].join("\n");
  }

  planRelease(version: string, goals: readonly FeatureGoal[]): ReleasePlan {
    return {
      version,
      releaseNotes: [`# Release ${version}`, "", ...goals.map((goal) => `- ${goal.title}: ${goal.summary}`)].join("\n"),
      migrationGuide: "No breaking migrations generated by Sprint 0 automation scaffolding.",
      compatibilityMatrix: ["Node 22", "pnpm 11.7.0", "Docker Compose", "Local-first runtime"],
      artifacts: ["API docs", "Developer guide", "Test report", "Security report", "Performance report"]
    };
  }

  dashboard(inventory: RepositoryInventory, buildStatus: EngineeringDashboardSnapshot["buildStatus"]): EngineeringDashboardSnapshot {
    const analysis = this.analyzeRepository(inventory);
    const docHealth = inventory.packages.length === 0 ? 100 : Math.round(((inventory.packages.length - analysis.missingDocs.length) / inventory.packages.length) * 100);
    const testHealth = inventory.packages.length === 0 ? 100 : Math.round(((inventory.packages.length - analysis.missingTests.length) / inventory.packages.length) * 100);
    return {
      repositoryHealth: analysis.securityRisks.length === 0 ? 90 : 70,
      packageHealth: analysis.duplicateCandidates.length === 0 ? 90 : 75,
      documentationHealth: docHealth,
      testingHealth: testHealth,
      securityHealth: analysis.securityRisks.length === 0 ? 90 : 65,
      sprintProgress: 100,
      technicalDebt: [...analysis.missingDocs.map((item) => `Missing docs for ${item}`), ...analysis.missingTests.map((item) => `Missing tests for ${item}`)],
      buildStatus
    };
  }

  private renderSpecFile(file: (typeof specFiles)[number], goal: FeatureGoal): string {
    const title = file.replace(".md", "").replace("-", " ");
    return [
      `# ${goal.id} ${title}`,
      "",
      `## Goal`,
      goal.title,
      "",
      "## Summary",
      goal.summary,
      "",
      "## Owner",
      goal.owner,
      "",
      "## Acceptance",
      ...goal.acceptance.map((item) => `- ${item}`),
      "",
      "## Package Hint",
      goal.packageHint ?? "TBD"
    ].join("\n");
  }
}

export const engineeringAgents: readonly AutomationAgentRole[] = [
  "spec-agent",
  "planning-agent",
  "repository-agent",
  "implementation-agent",
  "review-agent",
  "testing-agent",
  "documentation-agent",
  "release-agent",
  "security-agent",
  "performance-agent",
  "migration-agent",
  "architecture-guardian"
];
