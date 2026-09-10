#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_CLASSES = ["PUBLIC", "RESEARCH_PREPUBLICATION", "PROTECTED"];
export const REQUIRED_FORBIDDEN_DIRECTIONS = [
  "PUBLIC -> PROTECTED",
  "PUBLIC -> RESEARCH_PREPUBLICATION"
];
export const ALLOWED_DECISIONS = [
  "PUBLIC",
  "RESEARCH_PREPUBLICATION",
  "PROTECTED",
  "HOLD_RIGHTS_REVIEW"
];
export const REQUIRED_INTAKE_FIELDS = [
  "id",
  "title",
  "description",
  "proposed_class",
  "interoperability_need",
  "reproducibility_need",
  "strategic_disclosure_risk",
  "unpublished_research",
  "proprietary_asset_dependency",
  "third_party_inputs",
  "rights_status",
  "ai_assistance",
  "public_contract_required",
  "public_repository_implementation",
  "publication_requested",
  "decision",
  "decision_rationale"
];
export const REQUIRED_TOPOLOGY_SURFACES = [
  "PUBLIC_REPOSITORY",
  "RESEARCH_WORKSPACE",
  "PROTECTED_IMPLEMENTATION",
  "HOSTED_ENTERPRISE",
  "BRAND_CERTIFICATION_GOVERNANCE"
];

export function parsePolicy(text) {
  try {
    return { policy: JSON.parse(text), errors: [] };
  } catch (error) {
    return { policy: null, errors: [`classification document is malformed: ${error.message}`] };
  }
}

export function validatePolicy(policy, repositoryEntries = []) {
  const errors = [];
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    return ["classification document must contain an object"];
  }

  for (const requiredClass of REQUIRED_CLASSES) {
    if (!policy.classes?.includes(requiredClass)) {
      errors.push(`required class is missing: ${requiredClass}`);
    }
  }
  if (policy.default_new_strategic_rnd !== "RESEARCH_PREPUBLICATION") {
    errors.push("default new strategic R&D class must be RESEARCH_PREPUBLICATION");
  }
  for (const direction of REQUIRED_FORBIDDEN_DIRECTIONS) {
    if (!policy.forbidden_dependency_directions?.includes(direction)) {
      errors.push(`forbidden dependency direction is missing: ${direction}`);
    }
  }

  const publicPolicy = policy.public_repository_policy;
  if (!publicPolicy || typeof publicPolicy !== "object") {
    errors.push("public repository policy is missing");
  } else {
    if (publicPolicy.protected_implementation_allowed !== false) {
      errors.push("public repository policy must forbid protected implementation");
    }
    if (publicPolicy.research_prepublication_implementation_allowed !== false) {
      errors.push("public repository policy must forbid research-prepublication implementation");
    }
    if (publicPolicy.private_repository_access_required_for_build_test_release !== false) {
      errors.push("public build, test, and release must not require private repository access");
    }
    const forbidden = new Set(
      (publicPolicy.forbidden_source_directories ?? []).map((entry) => entry.toLowerCase())
    );
    for (const entry of repositoryEntries) {
      if (forbidden.has(entry.toLowerCase())) {
        errors.push(`forbidden public source directory is present: ${entry}`);
      }
    }
  }
  if (!policy.publication_gate_reference || !Array.isArray(policy.publication_gate)) {
    errors.push("publication gate is not defined");
  }

  return errors;
}

export function validateIntake(intake) {
  const errors = [];
  if (!intake || typeof intake !== "object" || Array.isArray(intake)) {
    return ["intake document must contain an object"];
  }
  for (const field of REQUIRED_INTAKE_FIELDS) {
    if (!(field in intake)) errors.push(`required intake field is missing: ${field}`);
  }
  if (intake.proposed_class && !REQUIRED_CLASSES.includes(intake.proposed_class)) {
    errors.push(`invalid proposed class: ${intake.proposed_class}`);
  }
  if (intake.decision && !ALLOWED_DECISIONS.includes(intake.decision)) {
    errors.push(`invalid intake decision: ${intake.decision}`);
  }
  const strategic =
    intake.unpublished_research === true || intake.strategic_disclosure_risk === "HIGH";
  if (strategic && (intake.proposed_class === "PUBLIC" || intake.decision === "PUBLIC")) {
    errors.push("strategic R&D cannot silently default to PUBLIC");
  }
  if (intake.rights_status === "UNRESOLVED" && intake.decision !== "HOLD_RIGHTS_REVIEW") {
    errors.push("unresolved rights must produce HOLD_RIGHTS_REVIEW");
  }
  if (
    intake.public_repository_implementation === true &&
    ["PROTECTED", "RESEARCH_PREPUBLICATION"].includes(intake.proposed_class)
  ) {
    errors.push(
      `${intake.proposed_class} implementation cannot be assigned to the public repository`
    );
  }
  if (
    intake.publication_requested === true &&
    intake.decision === "PUBLIC" &&
    intake.rights_status !== "CLEAR"
  ) {
    errors.push("publication request cannot bypass classification and rights review");
  }
  return errors;
}

export function validateTopology(topology) {
  const errors = [];
  if (!topology || typeof topology !== "object" || !Array.isArray(topology.surfaces)) {
    return ["topology document must define surfaces"];
  }
  const ids = new Set(topology.surfaces.map((surface) => surface.id));
  for (const id of REQUIRED_TOPOLOGY_SURFACES) {
    if (!ids.has(id)) errors.push(`required topology surface is missing: ${id}`);
  }
  const publicSurface = topology.surfaces.find((surface) => surface.id === "PUBLIC_REPOSITORY");
  if (
    !publicSurface ||
    !publicSurface.forbidden_classes?.includes("PROTECTED") ||
    !publicSurface.forbidden_classes?.includes("RESEARCH_PREPUBLICATION") ||
    publicSurface.build_boundary !== "PUBLIC_SOURCE_ONLY"
  ) {
    errors.push(
      "public topology surface must exclude restricted classes and restricted build inputs"
    );
  }
  const versioning = topology.contract_versioning;
  if (
    !versioning?.restricted_consumer_compatibility_check_required ||
    !versioning?.public_contracts_testable_without_restricted_code ||
    versioning?.public_release_coupled_to_restricted_release !== false
  ) {
    errors.push("cross-repository contract versioning boundary is incomplete");
  }
  return errors;
}

export function validateRepository(repositoryRoot = process.cwd()) {
  const policyPath = join(repositoryRoot, "governance", "ip-classification.json");
  if (!existsSync(policyPath)) {
    return [`classification document is missing: ${policyPath}`];
  }
  const parsed = parsePolicy(readFileSync(policyPath, "utf8"));
  if (parsed.errors.length > 0) return parsed.errors;
  const repositoryEntries = readdirSync(repositoryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const errors = validatePolicy(parsed.policy, repositoryEntries);
  for (const [reference, validator] of [
    [parsed.policy.topology_reference, validateTopology],
    [parsed.policy.intake_template_reference, validateIntake]
  ]) {
    if (!reference || !existsSync(join(repositoryRoot, reference))) {
      errors.push(`referenced governance document is missing: ${reference ?? "undefined"}`);
      continue;
    }
    const document = parsePolicy(readFileSync(join(repositoryRoot, reference), "utf8"));
    errors.push(...document.errors, ...(document.policy ? validator(document.policy) : []));
  }
  return errors;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const errors = validateRepository();
  if (errors.length > 0) {
    console.error("IP boundary validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`IP boundary validation passed: ${basename(process.cwd())}`);
  }
}
