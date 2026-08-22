import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatReleaseAnnouncement,
  getCommunityHealthMetrics
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.6 — Community Launch Verification", () => {
  it("evaluates community health metrics", () => {
    const health = getCommunityHealthMetrics();
    expect(health.version).toEqual("0.1.0-alpha.2");
    expect(health.healthScore).toEqual(100);
    expect(health.codeOfConductPresent).toBe(true);
  });

  it("formats community release announcement", () => {
    const announcement = formatReleaseAnnouncement(
      "v0.1.0-alpha.1",
      "https://github.com/Logorythmus-org/Semantiq.git"
    );
    expect(announcement).toContain("SemantIQ Benchmarks v0.1.0-alpha.1 Public Alpha Released!");
    expect(announcement).toContain("https://github.com/Logorythmus-org/Semantiq.git");
  });

  it("verifies community template files on disk", () => {
    expect(existsSync(".github/CODE_OF_CONDUCT.md")).toBe(true);
    expect(existsSync(".github/ISSUE_TEMPLATE/config.yml")).toBe(true);
    expect(existsSync(".github/ISSUE_TEMPLATE/benchmark_pack_proposal.yml")).toBe(true);
    expect(existsSync(".github/ISSUE_TEMPLATE/model_connector_request.yml")).toBe(true);
    expect(existsSync("Docs/COMMUNITY_LAUNCH_KIT.md")).toBe(true);
    expect(existsSync("Docs/ECOSYSTEM_CONTRIBUTION_GUIDE.md")).toBe(true);
    expect(existsSync("Docs/COMMUNITY_LAUNCH_REPORT.md")).toBe(true);
  });
});
