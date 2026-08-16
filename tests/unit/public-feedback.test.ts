import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  generateDecisionRecord,
  submitPublicFeedback,
  synthesizeFeedback,
  type PublicFeedbackItem
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.8 — Public Feedback Cycle Verification", () => {
  it("submits and sanitizes public feedback items", () => {
    const item = submitPublicFeedback("bug-report", "  Test Bug Title  ", " Description ");
    expect(item.title).toEqual("Test Bug Title");
    expect(item.category).toEqual("bug-report");
    expect(item.status).toEqual("new");
  });

  it("synthesizes feedback item lists into category summaries", () => {
    const items: readonly PublicFeedbackItem[] = [
      { id: "1", category: "bug-report", title: "Bug 1", description: "D", createdAt: "", status: "new" },
      { id: "2", category: "benchmark-request", title: "Bench 1", description: "D", createdAt: "", status: "new" }
    ];

    const synthesis = synthesizeFeedback(items);
    expect(synthesis.totalItems).toEqual(2);
    expect(synthesis.categories["bug-report"]).toEqual(1);
    expect(synthesis.topActionItems).toContain("[BUG-REPORT] Bug 1");
  });

  it("generates Product Decision Record markdown", () => {
    const pdr = generateDecisionRecord(1, "Test Decision", "Adopt local privacy model.");
    expect(pdr).toContain("# Product Decision Record PDR-001: Test Decision");
    expect(pdr).toContain("Adopt local privacy model.");
  });

  it("verifies public feedback files on disk", () => {
    expect(existsSync("Docs/PUBLIC_FEEDBACK_CYCLE.md")).toBe(true);
    expect(existsSync("Docs/FEEDBACK_TAXONOMY.md")).toBe(true);
    expect(existsSync("Docs/DECISION_RECORDS.md")).toBe(true);
    expect(existsSync("Docs/product-decisions/PDR-001-public-alpha-feedback-triage.md")).toBe(true);
    expect(existsSync("Docs/PUBLIC_FEEDBACK_REPORT.md")).toBe(true);

    const jsonStr = readFileSync("Docs/product-decisions/PDR-001-public-alpha-feedback-triage.md", "utf-8");
    expect(jsonStr).toContain("PDR-001");
  });
});
