import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const assets = new URL("../../packages/python/src/semantiq/assets/", import.meta.url);
const brain = readFileSync(new URL("semantiq-logo.txt", assets), "utf8");
const wordmark = readFileSync(new URL("semantiq-wordmark.txt", assets), "utf8");
const art = brain.trimEnd() + "\n\n" + wordmark.trimEnd() + "\n";

const execute = (args: string[] = []) =>
  execFileSync(process.execPath, ["scripts/semantiq-logo.mjs", ...args], {
    cwd: root,
    encoding: "utf8"
  });

describe("SemantIQ original ASCII branding and approved palette", () => {
  it("preserves original wordmark and compact brain", () => {
    expect(brain.trimEnd().split("\n")).toHaveLength(27);
    expect(wordmark.trimEnd().split("\n")).toHaveLength(8);
    expect(wordmark).toContain("░░█████████");
  });

  it("links the accessible approved README SVG with both ASCII shapes", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    const banner = readFileSync(
      new URL("../../Docs/branding/semantiq-brain-compact.svg", import.meta.url),
      "utf8"
    );
    expect(readme).toContain('src="Docs/branding/semantiq-brain-compact.svg"');
    for (const line of brain.trimEnd().split("\n")) {
      expect(banner).toContain(line);
    }
    for (const line of wordmark.trimEnd().split("\n")) {
      expect(banner).toContain(line);
    }
    expect(banner).toContain("#f7f8f7");
    expect(banner).toContain("#263039");
    expect(banner).toContain("#daa8a5");
    expect(banner).toContain("#ffffff");
    expect(banner).not.toContain("#ffb2ae");
    expect(banner).not.toContain("#38bdf8");
  });

  it("prints the exact Unicode glyphs in plain mode", () => {
    expect(execute()).toBe(art);
    expect(execute(["--color=never"])).toBe(art);
  });

  it("preserves original glyphs after ANSI stripping", () => {
    const colored = execute(["--color=always"]);
    expect(colored).toContain("\x1b[38;2;247;249;250m");
    expect(colored).toContain("\x1b[38;2;241;244;246m");
    expect(colored.replace(/\x1b\[[0-9;]*m/g, "")).toBe(art);
  });
});
