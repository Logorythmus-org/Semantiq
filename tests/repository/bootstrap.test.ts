import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredRootFiles = [
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "CHANGELOG.md",
  "ROADMAP.md",
  "ARCHITECTURE.md",
  "TECH_STACK.md",
  "pnpm-workspace.yaml",
  "turbo.json",
  "package.json",
  "docker-compose.yml",
  ".env.example",
  ".gitignore",
  ".editorconfig",
  ".gitattributes"
];

const requiredApps = ["web", "desktop", "mobile", "admin", "documentation", "playground", "benchmark", "demo"];
const requiredServices = [
  "api",
  "gateway",
  "search",
  "auth",
  "agent-runtime",
  "workflow-runtime",
  "knowledge-graph",
  "benchmark",
  "scheduler",
  "notification",
  "analytics",
  "sync",
  "marketplace"
];
const requiredPackages = [
  "core",
  "identity",
  "workspace",
  "knowledge",
  "questions",
  "semantiq",
  "graph",
  "research",
  "community",
  "narrative",
  "education",
  "governance",
  "marketplace",
  "wallet",
  "agent-os",
  "workflow",
  "compute",
  "federation",
  "sdk",
  "api",
  "events",
  "shared",
  "config",
  "ui"
];

describe("monorepo bootstrap", () => {
  it("contains required root files", () => {
    for (const file of requiredRootFiles) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it("contains required app shells", () => {
    for (const app of requiredApps) {
      expect(existsSync(join(root, "apps", app, "README.md")), app).toBe(true);
    }
  });

  it("contains required service shells", () => {
    for (const service of requiredServices) {
      expect(existsSync(join(root, "services", service, "README.md")), service).toBe(true);
    }
  });

  it("contains required production package shells", () => {
    for (const packageName of requiredPackages) {
      expect(existsSync(join(root, "packages", packageName, "README.md")), packageName).toBe(true);
    }
  });
});
