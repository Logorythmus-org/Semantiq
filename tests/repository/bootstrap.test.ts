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
  "pnpm-workspace.yaml",
  "turbo.json",
  "package.json",
  ".env.example",
  ".gitignore",
  ".editorconfig",
  ".gitattributes",
  "CITATION.cff",
  "codemeta.json"
];

const requiredApps = ["benchmark", "documentation", "playground", "web"];
const requiredServices = ["api"];
const requiredPackages = [
  "core",
  "contracts",
  "sandbox-contracts",
  "sandbox-router",
  "sandbox-tck",
  "semantiq",
  "evidence",
  "evidence-normalizer",
  "config",
  "diagnostics",
  "persistence",
  "security-hardening",
  "adapters",
  "adapter-oci",
  "adapter-opensandbox",
  "adapter-replay",
  "adapter-cloud-base",
  "capability-discovery",
  "environment-compiler",
  "lifecycle-engine",
  "shared",
  "tools",
  "ui",
  "sdk"
];

describe("monorepo bootstrap", () => {
  it("contains required root baseline files", () => {
    for (const file of requiredRootFiles) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it("contains required app shells", () => {
    for (const app of requiredApps) {
      expect(existsSync(join(root, "apps", app)), app).toBe(true);
    }
  });

  it("contains required service shells", () => {
    for (const service of requiredServices) {
      expect(existsSync(join(root, "services", service)), service).toBe(true);
    }
  });

  it("contains required production package shells", () => {
    for (const pkg of requiredPackages) {
      expect(existsSync(join(root, "packages", pkg)), pkg).toBe(true);
    }
  });
});
