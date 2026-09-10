import { describe, expect, it } from "vitest";

// @ts-expect-error The validator is an executable MJS module without a published type surface.
const validatorModule = await import("../../scripts/validate-ip-boundaries.mjs");
const { parsePolicy, validatePolicy, validateRepository } = validatorModule;

const validPolicy = {
  classes: ["PUBLIC", "RESEARCH_PREPUBLICATION", "PROTECTED"],
  default_new_strategic_rnd: "RESEARCH_PREPUBLICATION",
  forbidden_dependency_directions: ["PUBLIC -> PROTECTED", "PUBLIC -> RESEARCH_PREPUBLICATION"],
  public_repository_policy: {
    protected_implementation_allowed: false,
    research_prepublication_implementation_allowed: false,
    private_repository_access_required_for_build_test_release: false,
    forbidden_source_directories: ["private", "protected", "research-prepublication"]
  },
  publication_gate_reference: "Docs/governance/ip-architecture.md#publication-gate",
  publication_gate: ["PROVENANCE_CLEAR", "PUBLICATION_APPROVAL", "TESTS"]
};

describe("prospective IP boundary policy", () => {
  it("accepts the checked-in architecture policy", () => {
    expect(validateRepository()).toEqual([]);
  });

  it("rejects a missing PUBLIC -> PROTECTED prohibition", () => {
    const policy = structuredClone(validPolicy);
    policy.forbidden_dependency_directions = ["PUBLIC -> RESEARCH_PREPUBLICATION"];
    expect(validatePolicy(policy)).toContain(
      "forbidden dependency direction is missing: PUBLIC -> PROTECTED"
    );
  });

  it("rejects a missing PUBLIC -> RESEARCH_PREPUBLICATION prohibition", () => {
    const policy = structuredClone(validPolicy);
    policy.forbidden_dependency_directions = ["PUBLIC -> PROTECTED"];
    expect(validatePolicy(policy)).toContain(
      "forbidden dependency direction is missing: PUBLIC -> RESEARCH_PREPUBLICATION"
    );
  });

  it("rejects a missing default R&D classification", () => {
    const policy: Partial<typeof validPolicy> = structuredClone(validPolicy);
    delete policy.default_new_strategic_rnd;
    expect(validatePolicy(policy)).toContain(
      "default new strategic R&D class must be RESEARCH_PREPUBLICATION"
    );
  });

  it("rejects protected implementation in the public repository", () => {
    const policy = structuredClone(validPolicy);
    policy.public_repository_policy.protected_implementation_allowed = true;
    expect(validatePolicy(policy, ["protected"])).toEqual(
      expect.arrayContaining([
        "public repository policy must forbid protected implementation",
        "forbidden public source directory is present: protected"
      ])
    );
  });

  it("rejects malformed classification documents", () => {
    expect(parsePolicy('{"classes": [}').errors[0]).toMatch(/malformed/);
  });
});
