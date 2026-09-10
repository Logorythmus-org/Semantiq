import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// @ts-expect-error The validator is an executable MJS module without a published type surface.
const validatorModule = await import("../../scripts/validate-ip-boundaries.mjs");
const { parsePolicy, validateIntake, validateTopology } = validatorModule;

function intake(overrides: Record<string, unknown> = {}) {
  return {
    id: "FEATURE-001",
    title: "Interoperability contract",
    description: "A non-sensitive public contract proposal",
    proposed_class: "PUBLIC",
    interoperability_need: true,
    reproducibility_need: true,
    strategic_disclosure_risk: "LOW",
    unpublished_research: false,
    proprietary_asset_dependency: false,
    third_party_inputs: [],
    rights_status: "CLEAR",
    ai_assistance: "DISCLOSED",
    public_contract_required: true,
    public_repository_implementation: true,
    publication_requested: true,
    decision: "PUBLIC",
    decision_rationale: "Interoperability requires a public, independently testable contract",
    ...overrides
  };
}

describe("feature and research intake", () => {
  it("accepts an appropriately classified public interoperability feature", () => {
    expect(validateIntake(intake())).toEqual([]);
  });

  it("accepts strategic research classified RESEARCH_PREPUBLICATION", () => {
    expect(
      validateIntake(
        intake({
          proposed_class: "RESEARCH_PREPUBLICATION",
          public_repository_implementation: false,
          publication_requested: false,
          unpublished_research: true,
          strategic_disclosure_risk: "HIGH",
          decision: "RESEARCH_PREPUBLICATION"
        })
      )
    ).toEqual([]);
  });

  it("accepts unresolved rights routed to HOLD_RIGHTS_REVIEW", () => {
    expect(
      validateIntake(
        intake({
          proposed_class: "RESEARCH_PREPUBLICATION",
          public_repository_implementation: false,
          publication_requested: false,
          rights_status: "UNRESOLVED",
          decision: "HOLD_RIGHTS_REVIEW"
        })
      )
    ).toEqual([]);
  });

  it("rejects strategic R&D silently classified PUBLIC", () => {
    expect(validateIntake(intake({ unpublished_research: true }))).toContain(
      "strategic R&D cannot silently default to PUBLIC"
    );
  });

  it.each(["PROTECTED", "RESEARCH_PREPUBLICATION"])(
    "rejects %s implementation assigned to the public repository",
    (proposedClass) => {
      expect(validateIntake(intake({ proposed_class: proposedClass }))).toContain(
        `${proposedClass} implementation cannot be assigned to the public repository`
      );
    }
  );

  it("rejects an invalid class", () => {
    expect(validateIntake(intake({ proposed_class: "INTERNAL" }))).toContain(
      "invalid proposed class: INTERNAL"
    );
  });

  it("rejects publication_requested bypassing unresolved-rights review", () => {
    expect(validateIntake(intake({ rights_status: "UNRESOLVED" }))).toContain(
      "publication request cannot bypass classification and rights review"
    );
  });
});

describe("operational topology", () => {
  it("accepts the checked-in topology", () => {
    const topology = parsePolicy(
      readFileSync(new URL("../../governance/ip-topology.json", import.meta.url), "utf8")
    ).policy;
    expect(validateTopology(topology)).toEqual([]);
  });
});
