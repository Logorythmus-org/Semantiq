#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const checks = [];

function record(name, status, detail) {
  checks.push({ name, status, detail });
}

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32" });
}

record("package manifest", existsSync("package.json") ? "passed" : "failed", "package.json");
record(
  "workspace manifest",
  existsSync("pnpm-workspace.yaml") ? "passed" : "failed",
  "pnpm-workspace.yaml"
);
record("lockfile", existsSync("pnpm-lock.yaml") ? "passed" : "failed", "pnpm-lock.yaml");
record("node_modules", existsSync("node_modules") ? "passed" : "failed", "dependency directory");
record("env example", existsSync(".env.example") ? "passed" : "failed", ".env.example");
record(
  "test env example",
  existsSync(".env.test.example") ? "passed" : "failed",
  ".env.test.example"
);
record(
  "config package",
  existsSync(join("packages", "config", "src", "index.ts")) ? "passed" : "failed",
  "packages/config"
);
record(
  "shared package",
  existsSync(join("packages", "shared", "src", "index.ts")) ? "passed" : "failed",
  "packages/shared"
);
record(
  "persistence package",
  existsSync(join("packages", "persistence", "src", "index.ts")) ? "passed" : "failed",
  "packages/persistence"
);

const testFiles = readdirSync("tests", { recursive: true }).filter((entry) =>
  String(entry).endsWith(".test.ts")
);
record(
  "test discovery",
  testFiles.length > 0 ? "passed" : "failed",
  `${testFiles.length} root test files`
);

const compose = run("docker", ["compose", "config", "--quiet"]);
record(
  "docker compose config",
  compose.status === 0 ? "passed" : "failed",
  compose.stderr?.trim() || compose.stdout?.trim() || compose.error?.message || "unavailable"
);

const hardFailures = checks.filter(
  (check) => check.status === "failed" && check.name !== "docker compose config"
);
for (const check of checks) {
  console.log(`${check.status.toUpperCase()} ${check.name}: ${check.detail}`);
}

if (hardFailures.length > 0) {
  process.exit(1);
}
