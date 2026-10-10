#!/usr/bin/env node
import { readFileSync } from "node:fs";

const logo = readFileSync(
  new URL("../packages/python/src/semantiq/assets/semantiq-logo.txt", import.meta.url),
  "utf8"
);
process.stdout.write(logo);
