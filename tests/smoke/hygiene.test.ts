import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Repository Hygiene Smoke Tests", () => {
  it("verifies gitignore contains required sensitive & build rules", () => {
    expect(existsSync(".gitignore")).toBe(true);
    const content = readFileSync(".gitignore", "utf-8");
    expect(content).toContain("node_modules");
    expect(content).toContain(".env");
  });

  it("verifies zero committed API keys in example files", () => {
    if (existsSync(".env.example")) {
      const exampleContent = readFileSync(".env.example", "utf-8");
      expect(exampleContent).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      expect(exampleContent).not.toMatch(/AIza[a-zA-Z0-9_-]{30,}/);
    }
  });

  it("verifies documentation reports exist", () => {
    expect(existsSync("Docs/ACCESSIBILITY_REPORT.md")).toBe(true);
    expect(existsSync("Docs/PERFORMANCE_REPORT.md")).toBe(true);
    expect(existsSync("Docs/SECURITY_REPORT.md")).toBe(true);
    expect(existsSync("Docs/PRIVACY_REPORT.md")).toBe(true);
    expect(existsSync("Docs/LICENSING_REPORT.md")).toBe(true);
    expect(existsSync("Docs/REPOSITORY_HYGIENE_REPORT.md")).toBe(true);
    expect(existsSync("Docs/CONSOLIDATED_REMEDIATION_REGISTER.md")).toBe(true);
  });
});
