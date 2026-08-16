import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Kaggle Integration Verification", () => {
  it("verifies Kaggle example files exist on disk", () => {
    expect(existsSync("examples/kaggle/dataset-metadata.json")).toBe(true);
    expect(existsSync("examples/kaggle/semantiq_starter.py")).toBe(true);
    expect(existsSync("docs/integrations/connectors.md")).toBe(true);
  });
});
