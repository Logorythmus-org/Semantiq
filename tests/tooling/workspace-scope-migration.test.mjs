import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  migrateReferences,
  planWorkspaceScopeMigration,
  resolvePackageMapping
} from "../../scripts/migrate-internal-package-scope.mjs";

const LEGACY = "@tech" + "-club/";
const MODERN = "@logorythmus/";

test("only registered private first-party package identities are migrated", (t) => {
  const root = mkdtempSync(join(tmpdir(), "semantiq-private-scope-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ["apps/client", "packages/core", "packages/sdk", "services/api/src", "Docs/adr"]) {
    mkdirSync(join(root, dir), { recursive: true });
  }
  const core = join(root, "packages/core/package.json");
  const client = join(root, "apps/client/package.json");
  const sdk = join(root, "packages/sdk/package.json");
  const source = join(root, "services/api/src/service.ts");
  const history = join(root, "Docs/adr/history.md");
  const lock = join(root, "pnpm-lock.yaml");

  writeFileSync(core, JSON.stringify({ name: LEGACY + "core", private: true }));
  writeFileSync(client, JSON.stringify({
    name: LEGACY + "client",
    private: true,
    dependencies: { [LEGACY + "core"]: "workspace:*" }
  }));
  writeFileSync(sdk, JSON.stringify({ name: "@semantiq/sdk", private: false }));
  writeFileSync(source, `import { getCore } from "${LEGACY}core";\n`);
  writeFileSync(history, `Historic citation: ${LEGACY}core\n`);
  writeFileSync(lock, `importers:\n  packages/core: {}\n  # ${LEGACY}core\n`);
  const before = planWorkspaceScopeMigration(root, false);
  assert.equal(before.renamed_package_count, 2);
  assert.equal(before.changed_file_count, 3);
  assert.equal(JSON.parse(readFileSync(core, "utf8")).name, LEGACY + "core");
  const applied = planWorkspaceScopeMigration(root, true);
  assert.equal(applied.replacement_count, 4);
  assert.equal(JSON.parse(readFileSync(core, "utf8")).name, MODERN + "core");
  assert.equal(JSON.parse(readFileSync(client, "utf8")).dependencies[MODERN + "core"], "workspace:*");
  assert.match(readFileSync(source, "utf8"), /@logorythmus\/core/);
  assert.equal(JSON.parse(readFileSync(sdk, "utf8")).name, "@semantiq/sdk");
  assert.match(readFileSync(history, "utf8"), /@tech-club\/core/);
  assert.match(readFileSync(lock, "utf8"), /@tech-club\/core/);
  assert.equal(planWorkspaceScopeMigration(root, false).changed_file_count, 0);
});

test("refuses non-private legacy packages and target collisions", (t) => {
  const root = mkdtempSync(join(tmpdir(), "semantiq-scope-guard-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "packages", "a"), { recursive: true });
  mkdirSync(join(root, "packages", "b"), { recursive: true });
  const a = join(root, "packages/a/package.json");
  const b = join(root, "packages/b/package.json");
  writeFileSync(a, JSON.stringify({ name: LEGACY + "a" }));
  assert.throws(() => resolvePackageMapping(root), /non-private/);
  writeFileSync(a, JSON.stringify({ name: LEGACY + "a", private: true }));
  writeFileSync(b, JSON.stringify({ name: MODERN + "a", private: true }));
  assert.throws(() => resolvePackageMapping(root), /Target name already exists/);
});

test("never rewrites references to unknown legacy packages", () => {
  const input = `import a from "${LEGACY}a"; import b from "${LEGACY}unknown";`;
  const result = migrateReferences(input, new Map([[LEGACY + "a", MODERN + "a"]]));
  assert.match(result.updated, /@logorythmus\/a/);
  assert.match(result.updated, /@tech-club\/unknown/);
  assert.deepEqual(result.unmapped, [LEGACY + "unknown"]);
});

// Repository-level guard: no private workspace name should regress to the old scope.
test("active repository contains no old private workspace names", () => {
  const report = planWorkspaceScopeMigration();
  assert.equal(report.renamed_package_count, 0);
  assert.equal(report.changed_file_count, 0);
});
