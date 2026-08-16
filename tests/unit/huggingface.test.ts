import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Hugging Face & Connector Verification", () => {
  it("verifies connector documentation in curated docs", () => {
    expect(existsSync("docs/integrations/connectors.md")).toBe(true);
    expect(existsSync("examples/identifiers/benchmark-pack.json")).toBe(true);
  });
});
