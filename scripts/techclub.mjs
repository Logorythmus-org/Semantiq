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
  doctor: ["tsx", ["tools/automation/cli.mjs", "doctor"]],
  graph: ["tsx", ["tools/automation/cli.mjs", "graph"]],
  workspace: ["tsx", ["tools/automation/cli.mjs", "workspace"]],
  export: ["tsx", ["tools/automation/cli.mjs", "export"]],
  search: ["tsx", ["tools/automation/cli.mjs", "search"]],
  sprint2: ["tsx", ["tools/automation/cli.mjs", "sprint2"]],
  sprint3: ["tsx", ["tools/automation/cli.mjs", "sprint3"]],
  asset: ["tsx", ["tools/automation/cli.mjs", "asset"]],
  registry: ["tsx", ["tools/automation/cli.mjs", "registry"]],
  marketplace: ["tsx", ["tools/automation/cli.mjs", "marketplace"]],
  plugin: ["tsx", ["tools/automation/cli.mjs", "plugin"]],
  license: ["tsx", ["tools/automation/cli.mjs", "license"]],
  package: ["tsx", ["tools/automation/cli.mjs", "package"]],
  node: ["tsx", ["tools/automation/cli.mjs", "node"]],
  federation: ["tsx", ["tools/automation/cli.mjs", "federation"]],
  alpha: ["tsx", ["tools/automation/cli.mjs", "alpha"]],
  beta: ["tsx", ["tools/automation/cli.mjs", "beta"]],
  "safe-mode": ["tsx", ["tools/automation/cli.mjs", "safe-mode"]],
  backup: ["tsx", ["tools/automation/cli.mjs", "backup"]],
  diagnostics: ["tsx", ["tools/automation/cli.mjs", "diagnostics"]],
  feedback: ["tsx", ["tools/automation/cli.mjs", "feedback"]],
  compliance: ["tsx", ["tools/automation/cli.mjs", "compliance"]],
  security: ["tsx", ["tools/automation/cli.mjs", "security"]],
  privacy: ["tsx", ["tools/automation/cli.mjs", "privacy"]],
  performance: ["tsx", ["tools/automation/cli.mjs", "performance"]],
  accessibility: ["tsx", ["tools/automation/cli.mjs", "accessibility"]],
  semantiq: ["tsx", ["tools/automation/cli.mjs", "semantiq"]],
  research: ["tsx", ["tools/automation/cli.mjs", "research"]],
  release: ["pnpm", ["changeset"]],
  sprint: ["tsx", ["tools/automation/cli.mjs", "sprint"]],
  spec: ["tsx", ["tools/automation/cli.mjs", "spec"]],
  task: ["tsx", ["tools/automation/cli.mjs", "task"]],
  review: ["tsx", ["tools/automation/cli.mjs", "review"]],
  migrate: ["tsx", ["tools/automation/cli.mjs", "migrate"]],
  audit: ["tsx", ["tools/automation/cli.mjs", "audit"]],
  architecture: ["tsx", ["tools/automation/cli.mjs", "architecture"]],
  dashboard: ["tsx", ["tools/automation/cli.mjs", "dashboard"]],
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
const result = spawnSync(bin, [...binArgs, ...args], {
  stdio: "inherit",
  shell: process.platform === "win32"
});
process.exit(result.status ?? 1);
