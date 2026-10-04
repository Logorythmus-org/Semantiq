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
});
