import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const guidePath = "Docs/REPRODUCTION_WALKTHROUGH.md";
const formPath = ".github/ISSUE_TEMPLATE/independent_replication_report.yml";
const normalizedText = (path: string): string => readFileSync(path, "utf8").replace(/\s+/g, " ");

describe("Prompt 09 — independent replication submission surface", () => {
  it("keeps the canonical guide linked from public research navigation", () => {
    expect(existsSync(guidePath)).toBe(true);
    expect(existsSync(formPath)).toBe(true);

    for (const path of ["README.md", "Docs/DOCUMENTATION_INDEX.md", "Docs/research/README.md"]) {
      expect(readFileSync(path, "utf8")).toContain("REPRODUCTION_WALKTHROUGH.md");
    }

    expect(readFileSync(guidePath, "utf8")).toContain(
      "issues/new?template=independent_replication_report.yml"
    );
  });

  it("preserves all reproduction outcomes without auto-promoting success", () => {
    const guide = normalizedText(guidePath);
    const form = normalizedText(formPath);

    for (const status of [
      "SUCCESSFUL_REPRODUCTION",
      "PARTIAL_REPRODUCTION",
      "DIVERGENT_RESULT",
      "BLOCKED_REPRODUCTION"
    ]) {
      expect(guide).toContain(status);
      expect(form).toContain(`- ${status}`);
    }

    expect(guide).toContain("not automatically a verified external replication");
    expect(form).toContain(
      "SUCCESSFUL_REPRODUCTION do not automatically mean VERIFIED_EXTERNAL_REPLICATION"
    );
  });

  it("makes independence and maintainer classification explicit", () => {
    const guide = normalizedText(guidePath);

    for (const exclusion of [
      "not a SemantIQ owner account",
      "outside project-controlled CI",
      "owner-controlled clean-room execution",
      "bot rerun",
      "same project environment presented as external"
    ]) {
      expect(guide).toContain(exclusion);
    }

    for (const stage of [
      "submitted",
      "completeness check",
      "provenance and independence check",
      "reproduction-outcome classification",
      "accepted | needs-information | rejected-as-independent"
    ]) {
      expect(guide).toContain(stage);
    }
  });

  it("requires reviewable evidence and sanitization in the issue form", () => {
    const form = readFileSync(formPath, "utf8");

    for (const field of [
      "id: target_revision",
      "id: version_identity",
      "id: environment",
      "id: runtime_configuration",
      "id: input_classification",
      "id: command_transcript",
      "id: artifact",
      "id: checksums",
      "id: expected_observed",
      "id: logs",
      "id: independence",
      "id: submission_attestation"
    ]) {
      expect(form).toContain(field);
    }

    expect(form).toContain("SHA-256");
    expect(form).toContain("Remove credentials");
    expect(form).toContain("Do not upload confidential material");
  });

  it("does not relabel owner-controlled first-result or historical clean-room evidence", () => {
    const guide = readFileSync(guidePath, "utf8");
    const firstResult = readFileSync("tools/automation/first-result.ts", "utf8");
    const historicalGuide = readFileSync(
      "self-observation/INDEPENDENT_REPLICATION_GUIDE.md",
      "utf8"
    );
    const historicalAttempt = readFileSync("Docs/REPRODUCTION_ATTEMPT_REPORT.md", "utf8");

    expect(guide).toContain("origin: internal");
    expect(guide).toContain("input: synthetic");
    expect(guide).toContain("replicationStatus: not-independent-replication");
    expect(firstResult).toContain('origin: "internal"');
    expect(firstResult).toContain('input: "synthetic"');
    expect(firstResult).toContain('replicationStatus: "not-independent-replication"');
    expect(historicalGuide).toContain("owner-controlled clean-room procedure");
    expect(historicalAttempt).toContain("Not independent external replication");
  });
});
