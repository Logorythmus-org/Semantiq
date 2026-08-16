import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Repository Hygiene", () => {
  it("verifies essential public root and docs files", () => {
    expect(existsSync("README.md")).toBe(true);
    expect(existsSync("LICENSE")).toBe(true);
    expect(existsSync("docs/README.md")).toBe(true);
    expect(existsSync("package.json")).toBe(true);
  });
});
