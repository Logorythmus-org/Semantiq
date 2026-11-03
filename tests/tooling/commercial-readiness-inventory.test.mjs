import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  analyzeManifest,
  inventoryPackages
} from "../../scripts/commercial-readiness-inventory.mjs";

test("private packages do not trigger publishable-license warnings", () => {
  const result = analyzeManifest("packages/internal/package.json", {
    name: "@internal/core",
    private: true,
    dependencies: { "@internal/adapter": "workspace:*" }
  });
  assert.deepEqual(result.findings, []);
  assert.equal(result.dependencies[0].workspace, true);
});

test("publishable candidates expose missing license and workspace boundaries", () => {
  const result = analyzeManifest("packages/sdk/package.json", {
    name: "@semantiq/sdk",
    version: "0.1.0-alpha.2",
    dependencies: { "@internal/core": "workspace:*", "ajv": "^8.0.0" }
  });
  assert.deepEqual(result.findings, [
    "PUBLISHABLE_CANDIDATE_WITHOUT_LICENSE_FIELD",
    "PUBLISHABLE_CANDIDATE_WITH_WORKSPACE_DEPENDENCIES"
  ]);
  assert.equal(result.private, false);
  assert.equal(result.dependencies.filter((dep) => !dep.workspace).length, 1);
});

test("inventory is local, deterministic, and labels evidence limits", (t) => {
  const root = mkdtempSync(join(tmpdir(), "semantiq-commercial-inventory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "packages", "sdk"), { recursive: true });
  mkdirSync(join(root, "packages", "ignored", "node_modules", "nested"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "root", private: true }));
  writeFileSync(join(root, "packages", "sdk", "package.json"), JSON.stringify({
    name: "@semantiq/sdk", license: "MIT", version: "0.1.0",
    dependencies: { "example-package": "1.0.0" }
  }));
  writeFileSync(join(root, "packages", "ignored", "node_modules", "nested", "package.json"),
    JSON.stringify({ name: "ignored" }));
  writeFileSync(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");

  const report = inventoryPackages(root);
  assert.equal(report.summary.package_manifest_count, 2);
  assert.equal(report.summary.publishable_candidates_missing_license_field, 0);
  assert.equal(report.summary.unique_direct_external_dependency_names, 1);
  assert.match(report.lockfile_sha256, /^[a-f0-9]{64}$/);
  assert.match(report.evidence_boundary, /NOT_SBOM/);
});
