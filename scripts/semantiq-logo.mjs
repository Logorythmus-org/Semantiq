#!/usr/bin/env node
import { readFileSync } from "node:fs";

const assets = new URL("../packages/python/src/semantiq/assets/", import.meta.url);
const brain = readFileSync(new URL("semantiq-logo.txt", assets), "utf8");
const wordmark = readFileSync(new URL("semantiq-wordmark.txt", assets), "utf8");
const logo = brain.trimEnd() + "\n\n" + wordmark.trimEnd() + "\n";
const options = process.argv.slice(2);

if (options.length > 1 || (options.length && !/^--color=(auto|always|never)$/.test(options[0]))) {
  console.error("Usage: pnpm logo [--color=auto|always|never]");
  process.exit(2);
}

const mode = options.length ? options[0].slice("--color=".length) : "auto";
const color =
  mode === "always" ||
  (mode === "auto" &&
    process.stdout.isTTY &&
    !Object.hasOwn(process.env, "NO_COLOR") &&
    process.env.TERM !== "dumb");

if (!color) {
  process.stdout.write(logo);
} else {
  // Shared blush / rose / mauve / slate ANSI palette.
  const palette = [
    "255;178;174",
    "252;167;185",
    "225;166;197",
    "198;170;211",
    "160;179;204",
    "147;176;194"
  ];
  const lines = logo.trimEnd().split("\n");
  const columnCount = Math.max(...lines.map((line) => line.length));
  const colored = lines.map((line) =>
    palette
      .map((tone, i) => {
        const start = Math.floor((i * columnCount) / palette.length);
        const end = Math.floor(((i + 1) * columnCount) / palette.length);
        const segment = line.slice(start, end);
        return segment ? "\x1b[38;2;" + tone + "m" + segment + "\x1b[0m" : "";
      })
      .join("")
  );
  process.stdout.write(colored.join("\n") + "\n");
}
