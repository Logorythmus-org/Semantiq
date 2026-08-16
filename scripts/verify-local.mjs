import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const root = process.cwd();
const stages = [
  ["configuration", "pnpm", ["config:check", "--", "--json"]],
  ["format", "pnpm", ["format:check"]],
  ["lint", "pnpm", ["lint"]],
  ["typecheck", "pnpm", ["typecheck"]],
  ["tests", "pnpm", ["test"]],
  ["integration", "pnpm", ["test:integration"]],
  ["api", "pnpm", ["test:api"]],
  ["smoke", "pnpm", ["test:smoke"]],
  ["compose-config", "docker", ["compose", "config", "--quiet"]]
];
if (process.env.VERIFY_DOCKER === "1")
  stages.push(["docker-smoke", "docker", ["compose", "--profile", "test", "config", "--quiet"]]);

const results = [];
for (const [name, command, args] of stages) {
  const result = await run(command, args);
  results.push({
    name,
    command: [command, ...args].join(" "),
    status: result.code === 0 ? "passed" : "failed",
    exitCode: result.code,
    output: `${result.stdout}\n${result.stderr}`.trim()
  });
  console.log(`${result.code === 0 ? "PASSED" : "FAILED"} ${name}`);
  if (result.code !== 0 && process.env.VERIFY_CONTINUE !== "1") break;
}
if (!process.env.VERIFY_DOCKER)
  results.push({
    name: "docker-runtime",
    status: "not-executed",
    reason: "Set VERIFY_DOCKER=1 after Docker Desktop is available."
  });
await mkdir("artifacts/verification", { recursive: true });
await writeFile(
  "artifacts/verification/summary.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
);
process.exit(results.some((result) => result.status === "failed") ? 1 : 0);

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: root, shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}
