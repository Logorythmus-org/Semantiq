import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// @ts-expect-error The governance validator is executable MJS without a public type surface.
const validatorModule = await import("../../scripts/validate-ip-boundaries.mjs");
const { parsePolicy, validateResearchIntake, validateResearchPolicy, validateRepository } =
  validatorModule;

function readJson(path: string) {
  return parsePolicy(readFileSync(new URL(path, import.meta.url), "utf8")).policy;
}

function research(overrides: Record<string, unknown> = {}) {
  return {
    ...readJson("../../governance/intake/CYBER-BOOTSTRAP-001.json"),
    ...overrides
  };
}

describe("controlled research-start governance", () => {
  it("accepts the checked-in policy, template, and Cyber bootstrap intake", () => {
    expect(validateRepository()).toEqual([]);
    expect(validateResearchPolicy(readJson("../../governance/research-governance.json"))).toEqual(
      []
    );
    expect(validateResearchIntake(research())).toEqual([]);
  });

  it("rejects strategic research classified PUBLIC", () => {
    expect(validateResearchIntake(research({ research_class: "PUBLIC" }))).toContain(
      "strategic research cannot silently default to PUBLIC"
    );
  });

  it("rejects publication approval inferred inside research intake", () => {
    expect(validateResearchIntake(research({ publication_approved: true }))).toContain(
      "research intake cannot infer publication approval from implementation or testing"
    );
  });

  it("routes required unknown-rights material to HOLD_RIGHTS_REVIEW", () => {
    expect(
      validateResearchIntake(
        research({
          third_party_inputs: [{ classification: "UNKNOWN_RIGHTS", required: true }]
        })
      )
    ).toContain("required unresolved third-party input must produce HOLD_RIGHTS_REVIEW");
  });

  it("rejects prohibited third-party material", () => {
    expect(
      validateResearchIntake(
        research({ third_party_inputs: [{ classification: "PROHIBITED", required: false }] })
      )
    ).toContain("PROHIBITED third-party input cannot be accepted");
  });

  it.each(["RESEARCH_PREPUBLICATION", "PROTECTED"])(
    "rejects %s implementation in the public repository",
    (researchClass) => {
      expect(
        validateResearchIntake(
          research({
            research_class: researchClass,
            planned_repository_surface: "PUBLIC_REPOSITORY"
          })
        )
      ).toContain(`${researchClass} implementation cannot be placed in the public repository`);
    }
  );

  it("rejects automatic public routing for high-sensitivity Cyber work", () => {
    expect(
      validateResearchIntake(
        research({ cyber_dual_use_level: "CYBER_HIGH_SENSITIVITY", promotion_target: "PUBLIC" })
      )
    ).toContain("Cyber high-sensitivity research cannot be automatically marked PUBLIC");
  });

  it("rejects missing strategic-research provenance classification", () => {
    expect(validateResearchIntake(research({ provenance_classification: "" }))).toContain(
      "strategic research requires a provenance classification"
    );
  });

  it("rejects publication requested being treated as publication approved", () => {
    expect(
      validateResearchIntake(research({ publication_requested: true, publication_approved: true }))
    ).toContain("publication requested cannot be treated as publication approved");
  });

  it("preserves the no-relicensing research-start boundary", () => {
    const policy = readJson("../../governance/research-governance.json");
    policy.license_rules.research_start_requires_relicensing = true;
    expect(validateResearchPolicy(policy)).toContain("research-start license boundary is invalid");
  });
});
