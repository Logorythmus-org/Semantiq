import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const art = readFileSync(
  new URL("../../packages/python/src/semantiq/assets/semantiq-logo.txt", import.meta.url),
  "utf8"
);

const execute = (args: string[] = []) =>
  execFileSync(process.execPath, ["scripts/semantiq-logo.mjs", ...args], {
    cwd: root,
    encoding: "utf8"
  });

describe("SemantIQ compact terminal branding", () => {
  it("links the colored README SVG rather than embedding oversized terminal art", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    expect(readme).toContain('src="Docs/branding/semantiq-brain-compact.svg"');
    expect(readme).not.toContain("█████████");
  });

  it("prints compact art without ANSI when piped", () => {
    expect(execute()).toBe(art);
    expect(execute(["--color=never"])).toBe(art);
  });

  it("supports forced ANSI color while preserving original glyphs", () => {
    const colored = execute(["--color=always"]);
    expect(colored).toContain("\x1b[38;2;");
    expect(colored.replace(/\x1b\[[0-9;]*m/g, "")).toBe(art);
  });
});
