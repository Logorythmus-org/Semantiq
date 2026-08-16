import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Intellectual Property, Provenance & Rights", () => {
  it("verifies all IP and rights documentation files exist", () => {
    expect(existsSync("docs/project/governance.md")).toBe(true);
    expect(existsSync("docs/project/licensing.md")).toBe(true);
    expect(existsSync("LICENSE")).toBe(true);
  });

  it("verifies licensing and contributor governance terms", () => {
    const govContent = readFileSync("docs/project/governance.md", "utf-8");
    expect(govContent).toContain("Logorythmus");
    expect(govContent).toContain("Contributor Covenant");
  });
});
