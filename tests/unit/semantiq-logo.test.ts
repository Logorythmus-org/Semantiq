import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const art = readFileSync(
  new URL("../../packages/python/src/semantiq/assets/semantiq-logo.txt", import.meta.url),
  "utf8"
);

describe("SemantIQ terminal branding", () => {
  it("renders the same canonical Unicode artwork in README", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    expect(readme).toContain(["```text", art.trimEnd(), "```"].join("\n"));
  });

  it("prints the canonical artwork through the source-checkout Node command", () => {
    const output = execFileSync(process.execPath, ["scripts/semantiq-logo.mjs"], {
      cwd: root,
      encoding: "utf8"
    });
    expect(output).toBe(art);
  });
});
