#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const command = process.argv[2] ?? "help";
const args = process.argv.slice(3);

const commands = {
  init: ["pnpm", ["install"]],
  install: ["pnpm", ["install"]],
  build: ["pnpm", ["build"]],
  dev: ["pnpm", ["-r", "--parallel", "--if-present", "dev"]],
  lint: ["pnpm", ["lint"]],
  test: ["pnpm", ["test"]],
  docs: ["pnpm", ["-r", "--if-present", "docs"]],
  benchmark: ["pnpm", ["-r", "--if-present", "benchmark"]],
  doctor: ["node", ["tools/automation/cli.mjs", "doctor"]],
  graph: ["node", ["tools/automation/cli.mjs", "graph"]],
  workspace: ["node", ["tools/automation/cli.mjs", "workspace"]],
  export: ["node", ["tools/automation/cli.mjs", "export"]],
  search: ["node", ["tools/automation/cli.mjs", "search"]],
  sprint2: ["node", ["tools/automation/cli.mjs", "sprint2"]],
  sprint3: ["node", ["tools/automation/cli.mjs", "sprint3"]],
  asset: ["node", ["tools/automation/cli.mjs", "asset"]],
  registry: ["node", ["tools/automation/cli.mjs", "registry"]],
  marketplace: ["node", ["tools/automation/cli.mjs", "marketplace"]],
  plugin: ["node", ["tools/automation/cli.mjs", "plugin"]],
  license: ["node", ["tools/automation/cli.mjs", "license"]],
  package: ["node", ["tools/automation/cli.mjs", "package"]],
  node: ["node", ["tools/automation/cli.mjs", "node"]],
  federation: ["node", ["tools/automation/cli.mjs", "federation"]],
  alpha: ["node", ["tools/automation/cli.mjs", "alpha"]],
  beta: ["node", ["tools/automation/cli.mjs", "beta"]],
  "safe-mode": ["node", ["tools/automation/cli.mjs", "safe-mode"]],
  backup: ["node", ["tools/automation/cli.mjs", "backup"]],
  diagnostics: ["node", ["tools/automation/cli.mjs", "diagnostics"]],
  feedback: ["node", ["tools/automation/cli.mjs", "feedback"]],
  compliance: ["node", ["tools/automation/cli.mjs", "compliance"]],
  security: ["node", ["tools/automation/cli.mjs", "security"]],
  privacy: ["node", ["tools/automation/cli.mjs", "privacy"]],
  performance: ["node", ["tools/automation/cli.mjs", "performance"]],
  accessibility: ["node", ["tools/automation/cli.mjs", "accessibility"]],
  semantiq: ["node", ["tools/automation/cli.mjs", "semantiq"]],
  research: ["node", ["tools/automation/cli.mjs", "research"]],
  release: ["pnpm", ["changeset"]],
  sprint: ["node", ["tools/automation/cli.mjs", "sprint"]],
  spec: ["node", ["tools/automation/cli.mjs", "spec"]],
  task: ["node", ["tools/automation/cli.mjs", "task"]],
  review: ["node", ["tools/automation/cli.mjs", "review"]],
  migrate: ["node", ["tools/automation/cli.mjs", "migrate"]],
  audit: ["node", ["tools/automation/cli.mjs", "audit"]],
  architecture: ["node", ["tools/automation/cli.mjs", "architecture"]],
  dashboard: ["node", ["tools/automation/cli.mjs", "dashboard"]],
  clean: ["pnpm", ["-r", "--if-present", "clean"]],
  reset: ["pnpm", ["install", "--force"]]
};

if (command === "help" || !commands[command]) {
  console.log("Tech Club CLI");
  console.log(
    "Commands: init, install, build, dev, lint, test, docs, benchmark, release, sprint, sprint2, sprint3, spec, task, review, migrate, audit, workspace, graph, export, search, semantiq, research, asset, registry, marketplace, plugin, license, package, node, federation, alpha, beta, safe-mode, backup, diagnostics, feedback, compliance, security, privacy, performance, accessibility, doctor, architecture, dashboard, clean, reset"
  );
  process.exit(command === "help" ? 0 : 1);
}

const [bin, binArgs] = commands[command];
const result = spawnSync(bin, [...binArgs, ...args], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
