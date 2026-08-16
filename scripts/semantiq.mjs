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
  preflight: ["tsx", ["tools/automation/cli.mjs", "preflight"]],
  connector: ["tsx", ["tools/automation/cli.mjs", "connector"]],
  smoke: ["tsx", ["tools/automation/cli.mjs", "smoke"]],
  semantiq: ["tsx", ["tools/automation/cli.mjs", "semantiq"]],
  reproduce: ["tsx", ["tools/automation/cli.mjs", "reproduce"]],
  export: ["tsx", ["tools/automation/cli.mjs", "export"]],
  clean: ["pnpm", ["-r", "--if-present", "clean"]],
  reset: ["pnpm", ["install", "--force"]]
};

if (command === "help" || command === "--help" || command === "-h" || !commands[command]) {
  console.log("SemantIQ CLI");
  console.log(
    "Commands: doctor, preflight, connector, smoke, semantiq, reproduce, export, install, build, test, lint, docs, benchmark, clean, reset"
  );
  process.exit(command === "help" || command === "--help" || command === "-h" ? 0 : 1);
}

const [bin, binArgs] = commands[command];
const result = spawnSync(bin, [...binArgs, ...args], {
  stdio: "inherit",
  shell: process.platform === "win32"
});
process.exit(result.status ?? 1);
