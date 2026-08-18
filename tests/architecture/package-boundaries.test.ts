import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CORE_DOMAIN_PACKAGES = [
  "core",
  "shared",
  "config",
  "benchmark",
  "evidence",
  "research",
  "sandbox-contracts",
  "sandbox-router",
  "sandbox-tck",
  "adapters",
  "sdk",
  "semantiq"
];

const PROHIBITED_FRAMEWORKS = [
  "react",
  "react-dom",
  "fastify",
  "express",
  "@nestjs",
  "vue",
  "svelte",
  "solid-js",
  "flutter",
  "react-native"
];

function scanFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (["node_modules", "dist", ".turbo", ".git"].includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanFiles(fullPath, fileList);
      } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        fileList.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist in some environments
  }
  return fileList;
}

describe("SemantIQ Product Architecture & Package Boundaries", () => {
  it("enforces that no package in packages/ imports from apps/", () => {
    const allPackageFiles = scanFiles("packages");
    const violations: { file: string; line: string }[] = [];

    for (const file of allPackageFiles) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (
          /from\s+["'](?:\.\.\/)*apps\//.test(line) ||
          /import\(["'](?:\.\.\/)*apps\//.test(line)
        ) {
          violations.push({ file, line: line.trim() });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("enforces that Core Domain packages do not import prohibited web/UI/server frameworks", () => {
    const violations: { package: string; file: string; prohibited: string }[] = [];

    for (const pkgName of CORE_DOMAIN_PACKAGES) {
      const pkgFiles = scanFiles(join("packages", pkgName));
      for (const file of pkgFiles) {
        const content = readFileSync(file, "utf8");
        for (const framework of PROHIBITED_FRAMEWORKS) {
          const regex = new RegExp(`from\\s+["']${framework}(?:/.*)?["']`, "g");
          if (regex.test(content)) {
            violations.push({ package: pkgName, file, prohibited: framework });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("enforces that Core Domain packages do not import from services/", () => {
    const violations: { package: string; file: string; line: string }[] = [];

    for (const pkgName of CORE_DOMAIN_PACKAGES.filter((p) => p !== "semantiq")) {
      const pkgFiles = scanFiles(join("packages", pkgName));
      for (const file of pkgFiles) {
        const content = readFileSync(file, "utf8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (
            /from\s+["'](?:\.\.\/)*services\//.test(line) ||
            /import\(["'](?:\.\.\/)*services\//.test(line)
          ) {
            violations.push({ package: pkgName, file, line: line.trim() });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
