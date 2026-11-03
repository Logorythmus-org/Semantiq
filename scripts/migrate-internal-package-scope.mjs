#!/usr/bin/env node
/**
 * Narrow, compatibility-conscious migration of private, first-party pnpm package
 * names and references: @tech-club/* -> @logorythmus/*.
 *
 * This script does NOT change public @semantiq/* names, stored data, environment
 * variables, already published packages, release tags or historical documentation.
 * Regenerate the actual pnpm lockfile with pnpm after applying this migration.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACES = ["apps", "packages", "services", "tooling", "examples"];
const ACTIVE = [...WORKSPACES, "plugins", "tools", "scripts", "tests"];
const SKIP_DIRS = new Set([
  ".git", "node_modules", ".venv", "__pycache__", "dist", "build",
  "coverage", ".next", ".turbo", ".cache", "fixtures"
]);
const TEXT_EXTS = new Set([
  ".json", ".js", ".jsx", ".cjs", ".mjs", ".ts", ".tsx", ".mts",
  ".cts", ".yaml", ".yml", ".md"
]);
const ROOT_FILES = [
  "package.json", "tsconfig.base.json", "vitest.config.mjs",
  "eslint.config.mjs", "pnpm-workspace.yaml"
];
const LEGACY_PACKAGE = /@tech-club\/[a-z0-9][a-z0-9._-]*/g;

function walk(dir, results) {
  if (!existsSync(dir)) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.isSymbolicLink()) continue;
    const f = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(f, results);
    } else if (ent.isFile() && TEXT_EXTS.has(extname(ent.name))) {
      results.push(f);
    }
  }
}

export function resolvePackageMapping(root) {
  const legacy = new Map();
  const names = new Map();
  let manifestCount = 0;
  for (const workspace of WORKSPACES) {
    const dir = join(root, workspace);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const file = join(dir, entry.name, "package.json");
      if (!existsSync(file)) continue;
      manifestCount++;
      const data = JSON.parse(readFileSync(file, "utf8"));
      const name = data.name;
      if (typeof name !== "string" || !name.trim()) {
        throw new Error(`Missing package name: ${relative(root, file)}`);
      }
      if (names.has(name)) {
        throw new Error(`Duplicate workspace package name ${name}`);
      }
      names.set(name, file);
      if (name.startsWith("@tech-club/")) {
        if (data.private !== true) {
          throw new Error(`Refusing to rename non-private package ${name}; release migration required`);
        }
        legacy.set(name, name.replace(/^@tech-club\//, "@logorythmus/"));
      }
    }
  }
  for (const [oldName, nextName] of legacy) {
    if (names.has(nextName)) {
      throw new Error(`Target name already exists: ${oldName} => ${nextName}`);
    }
  }
  return { legacy, manifestCount };
}

function targetFiles(root) {
  const files = [];
  for (const dir of ACTIVE) walk(join(root, dir), files);
  walk(join(root, ".github", "workflows"), files);
  for (const file of ROOT_FILES) {
    if (existsSync(join(root, file))) files.push(join(root, file));
  }
  return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}

export function migrateReferences(source, packageMap) {
  const unmapped = new Set();
  const updated = source.replace(LEGACY_PACKAGE, (value) => {
    if (!packageMap.has(value)) {
      unmapped.add(value);
      return value;
    }
    return packageMap.get(value);
  });
  return { updated, unmapped: [...unmapped].sort() };
}

export function planWorkspaceScopeMigration(root = ROOT, apply = false) {
  const { legacy, manifestCount } = resolvePackageMapping(root);
  const changedFiles = [];
  const unknownReferences = new Map();
  let replacements = 0;
  for (const file of targetFiles(root)) {
    const old = readFileSync(file, "utf8");
    const { updated, unmapped } = migrateReferences(old, legacy);
    const name = relative(root, file).replaceAll("\\", "/");
    if (unmapped.length) unknownReferences.set(name, unmapped);
    if (updated === old) continue;
    changedFiles.push(name);
    const oldNames = old.match(LEGACY_PACKAGE) || [];
    replacements += oldNames.filter((x) => legacy.has(x)).length;
    if (apply) writeFileSync(file, updated, "utf8");
  }
  return {
    schema: "semantiq.workspace-scope-migration.v1",
    mode: apply ? "apply" : "dry-run",
    old_scope: "@tech-club/",
    new_scope: "@logorythmus/",
    publication_boundary: "PRIVATE_FIRST_PARTY_PACKAGES_ONLY",
    workspace_manifest_count: manifestCount,
    renamed_package_count: legacy.size,
    changed_file_count: changedFiles.length,
    replacement_count: replacements,
    changed_files: changedFiles,
    unresolved_legacy_references: Object.fromEntries(unknownReferences),
    scope_mapping: Object.fromEntries([...legacy.entries()].sort(([a], [b]) => a.localeCompare(b))),
    note: "Regenerate pnpm-lock.yaml using pnpm; not an npm publication or runtime-data migration."
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  const report = planWorkspaceScopeMigration(ROOT, args.has("--apply"));
  if (args.has("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write(
      `${report.mode}: ${report.renamed_package_count} private packages, ${report.changed_file_count} files, ${report.replacement_count} references\n`
    );
    if (Object.keys(report.unresolved_legacy_references).length) {
      process.stdout.write(
        `Unmapped references in ${Object.keys(report.unresolved_legacy_references).length} files; see --json\n`
      );
    }
  }
  if (args.has("--strict") && Object.keys(report.unresolved_legacy_references).length) {
    process.exitCode = 1;
  }
}
