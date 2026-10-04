import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SemantIQ Master Prompt 02 — Clean-Room Reproducibility", () => {
  it("keeps internal clean-room evidence within the public limitations boundary", () => {
    const limitationsPath = path.join(process.cwd(), "Docs", "KNOWN_LIMITATIONS.md");
    expect(fs.existsSync(limitationsPath)).toBe(true);

    const limitations = fs.readFileSync(limitationsPath, "utf-8");
    expect(limitations).toContain("external replication are **not yet established**");
    expect(limitations).toContain("internal validation only");
    expect(limitations).toContain("not independent replication");
  });

  it("validates that INDEPENDENT_REPLICATION_GUIDE.md documents all clean-room commands", () => {
    const guidePath = path.join(
      process.cwd(),
      "self-observation",
      "INDEPENDENT_REPLICATION_GUIDE.md"
    );
    expect(fs.existsSync(guidePath)).toBe(true);

    const content = fs.readFileSync(guidePath, "utf-8");
    expect(content).toContain("pnpm install --frozen-lockfile");
    expect(content).toContain("boundary-validator.mjs");
    expect(content).toContain("pnpm typecheck");
    expect(content).toContain("pnpm test");
    expect(content).toContain("CHECKSUMS.sha256");
  });
});
