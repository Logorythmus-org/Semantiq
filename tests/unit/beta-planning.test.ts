import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateBetaReadiness,
  generateBetaMilestoneRoadmap
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.10 — Beta Planning Verification", () => {
  it("evaluates Beta readiness score and open blockers", () => {
    const readiness = evaluateBetaReadiness();
    expect(readiness.readinessScore).toEqual(100);
    expect(readiness.status).toEqual("ready");
    expect(readiness.openBlockers).toEqual(0);
  });

  it("generates Beta milestone roadmap items", () => {
    const roadmap = generateBetaMilestoneRoadmap();
    expect(roadmap.length).toBeGreaterThanOrEqual(3);
    expect(roadmap[0]?.id).toEqual("beta-m1");
  });

  it("verifies Beta planning files on disk", () => {
    expect(existsSync("Docs/BETA_ROADMAP.md")).toBe(true);
    expect(existsSync("Docs/BETA_READINESS_CRITERIA.md")).toBe(true);
    expect(existsSync("Docs/BETA_PLANNING_REPORT.md")).toBe(true);
    expect(existsSync("Docs/PHASE_7_HANDOFF_TO_PHASE_8.md")).toBe(true);

    const roadmapStr = readFileSync("Docs/BETA_ROADMAP.md", "utf-8");
    expect(roadmapStr).toContain("0.2.0-beta.1");
  });
});
