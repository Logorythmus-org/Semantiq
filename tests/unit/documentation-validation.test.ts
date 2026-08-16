import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Documentation Validation", () => {
  it("verifies master documentation index and key guide files exist", () => {
    expect(existsSync("docs/README.md")).toBe(true);
    expect(existsSync("docs/getting-started/index.md")).toBe(true);
    expect(existsSync("docs/getting-started/installation.md")).toBe(true);
    expect(existsSync("docs/concepts/architecture.md")).toBe(true);
    expect(existsSync("docs/project/limitations.md")).toBe(true);
  });
});
