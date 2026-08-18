// @ts-nocheck
import { describe, it, expect } from "vitest";
import path from "node:path";
import { validateProductBoundary } from "../../scripts/boundary-validator.mjs";

describe("Boundary Validator", () => {
  it("validates current workspace SemantIQ product boundary", () => {
    const parentRoot = path.resolve(__dirname, "../../");
    const result = validateProductBoundary(parentRoot);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
