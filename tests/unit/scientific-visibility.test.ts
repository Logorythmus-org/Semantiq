import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Scientific Visibility & Citation Verification", () => {
  it("verifies citation metadata and docs on disk", () => {
    expect(existsSync("examples/citation/datacite.json")).toBe(true);
    expect(existsSync("CITATION.cff")).toBe(true);
    expect(existsSync("codemeta.json")).toBe(true);
    expect(existsSync("docs/project/licensing.md")).toBe(true);
  });
});
