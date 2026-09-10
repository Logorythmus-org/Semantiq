#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_CLASSES = ["PUBLIC", "RESEARCH_PREPUBLICATION", "PROTECTED"];
export const REQUIRED_FORBIDDEN_DIRECTIONS = [
  "PUBLIC -> PROTECTED",
  "PUBLIC -> RESEARCH_PREPUBLICATION"
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
  return validatePolicy(parsed.policy, repositoryEntries);
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
