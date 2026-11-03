#!/usr/bin/env node
/**
 * Offline, first-party package-manifest inventory for a commercial-readiness review.
 *
 * This does NOT establish legal rights, enumerate transitive dependency licenses,
 * perform vulnerability scanning, or produce an SBOM.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE_ROOTS = ["apps", "packages", "services", "plugins", "tools"];
const EXCLUDED_DIRECTORIES = new Set([
  ".git", ".cache", "node_modules", "dist", "build", "coverage",
  ".next", ".turbo", ".venv", "__pycache__"
]);
const DEPENDENCY_FIELDS = [
  "dependencies", "optionalDependencies", "peerDependencies", "devDependencies"
];

function normalizeLicense(value) {
  if (typeof value === "string") return value.trim() || null;
  // Historical license objects are not authoritative SPDX expressions.
  return null;
}

export function analyzeManifest(path, manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError(`Invalid package manifest object at ${path}`);
  }

  const isPrivate = manifest.private === true;
  const license = normalizeLicense(manifest.license);
  const dependencies = [];
  for (const field of DEPENDENCY_FIELDS) {
    const items = manifest[field];
    if (!items || typeof items !== "object" || Array.isArray(items)) continue;
    for (const [name, spec] of Object.entries(items)) {
      dependencies.push({
        name,
        range: typeof spec === "string" ? spec : String(spec),
        kind: field,
        workspace: typeof spec === "string" && spec.startsWith("workspace:")
      });
    }
  }

  const findings = [];
  if (typeof manifest.name !== "string" || !manifest.name.trim()) {
    findings.push("MISSING_PACKAGE_NAME");
  }
  if (!isPrivate && !license) findings.push("PUBLISHABLE_CANDIDATE_WITHOUT_LICENSE_FIELD");
  if (!isPrivate && dependencies.some((dep) => dep.workspace)) {
    findings.push("PUBLISHABLE_CANDIDATE_WITH_WORKSPACE_DEPENDENCIES");
  }

  return {
    path,
    name: typeof manifest.name === "string" ? manifest.name : null,
    version: typeof manifest.version === "string" ? manifest.version : null,
    private: isPrivate,
    license,
    dependencies,
    findings
  };
}

function listPackageManifests(root) {
  const result = [];
  const visit = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRECTORIES.has(entry.name)) visit(full);
      } else if (entry.isFile() && entry.name === "package.json") {
        result.push(full);
      }
    }
  };
  if (existsSync(join(root, "package.json"))) result.push(join(root, "package.json"));
  for (const segment of WORKSPACE_ROOTS) visit(join(root, segment));
  return result.sort((a, b) => a.localeCompare(b));
}

export function inventoryPackages(root = REPO_ROOT) {
  const packages = [];
  const errors = [];
  for (const file of listPackageManifests(root)) {
    const path = relative(root, file).replaceAll("\\", "/");
    try {
      const manifest = JSON.parse(readFileSync(file, "utf8"));
      packages.push(analyzeManifest(path, manifest));
    } catch (error) {
      errors.push({ path, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const lockFile = join(root, "pnpm-lock.yaml");
  const lockfileSha256 = existsSync(lockFile)
    ? createHash("sha256").update(readFileSync(lockFile)).digest("hex")
    : null;

  const allDependencies = new Set();
  for (const item of packages) {
    for (const dep of item.dependencies) if (!dep.workspace) allDependencies.add(dep.name);
  }
  const missingLicenseFields = packages.filter((p) =>
    p.findings.includes("PUBLISHABLE_CANDIDATE_WITHOUT_LICENSE_FIELD")
  );
  const workspacePublishCandidates = packages.filter((p) =>
    p.findings.includes("PUBLISHABLE_CANDIDATE_WITH_WORKSPACE_DEPENDENCIES")
  );

  return {
    schema: "semantiq.first-party-package-manifest-inventory.v1",
    evidence_boundary: "MANIFEST_ONLY_NOT_SBOM_NOT_THIRD_PARTY_LICENSE_CLEARANCE",
    repository_revision: process.env.GITHUB_SHA || null,
    lockfile_sha256: lockfileSha256,
    summary: {
      package_manifest_count: packages.length,
      private_package_count: packages.filter((p) => p.private).length,
      publishable_candidate_count: packages.filter((p) => !p.private).length,
      publishable_candidates_missing_license_field: missingLicenseFields.length,
      publishable_candidates_with_workspace_dependency: workspacePublishCandidates.length,
      unique_direct_external_dependency_names: allDependencies.size,
      parse_error_count: errors.length
    },
    packages,
    errors
  };
}

const isMainModule = process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const args = new Set(process.argv.slice(2));
  const report = inventoryPackages();
  if (args.has("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write("SemantIQ first-party manifest inventory (not a license clearance)\n");
    for (const [key, value] of Object.entries(report.summary)) {
      process.stdout.write(`  ${key}: ${value}\n`);
    }
    process.stdout.write(`  lockfile_sha256: ${report.lockfile_sha256 || "missing"}\n`);
  }

  if (args.has("--strict") && (
    report.errors.length > 0 ||
    report.summary.publishable_candidates_missing_license_field > 0
  )) {
    process.exitCode = 1;
  }
}
