#!/usr/bin/env node
import { readFileSync } from "node:fs";

const logo = readFileSync(
  new URL("../packages/python/src/semantiq/assets/semantiq-logo.txt", import.meta.url),
  "utf8"
);
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
  const palette = [
    "167;139;250",
    "129;140;248",
    "56;189;248",
    "34;211;238",
    "45;212;191",
    "52;211;153"
  ];
  const lines = logo.trimEnd().split("\n");
  const output =
    lines
      .map((line, i) => {
        const tone =
          palette[Math.min(Math.floor((i * palette.length) / lines.length), palette.length - 1)];
        return "\x1b[38;2;" + tone + "m" + line + "\x1b[0m";
      })
      .join("\n") + "\n";
  process.stdout.write(output);
}
