import { describe, expect, it } from "vitest";

const forbiddenAppImportPattern = /from\s+["'](?:\.\.\/)*apps\//;

describe("package boundaries", () => {
  it("documents that packages must not import apps", () => {
    expect(forbiddenAppImportPattern.test("import x from '../../apps/web'")).toBe(true);
  });
});
