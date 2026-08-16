#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".git")) {
  console.log("prepare: skipping husky because .git is not present");
  process.exit(0);
}

const result = spawnSync("husky", { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
