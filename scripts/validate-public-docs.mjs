#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const repositoryRoot = process.cwd();
const generatedDocsRoot = join(repositoryRoot, "dist", "docs");

const activePublicFiles = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ".github/pull_request_template.md",
  "Docs/DOCUMENTATION_INDEX.md",
  "Docs/QUICK_START.md",
  "Docs/INSTALLATION_MATRIX.md",
  "Docs/getting-started/README.md",
  "Docs/concepts/README.md",
  "Docs/architecture/README.md",
  "Docs/benchmarks/README.md",
  "Docs/evidence/README.md",
  "Docs/research/README.md",
  "Docs/governance/README.md",
  "Docs/partners/README.md",
  "Docs/api/README.md",
  "Docs/sdk/README.md",
  "Docs/security/README.md",
  "Docs/releases/README.md",
  "Docs/adr/README.md",
  "packages/sdk/README.md",
  "packages/python/README.md"
];

const issueTemplateDirectory = join(repositoryRoot, ".github", "ISSUE_TEMPLATE");
for (const entry of readdirSync(issueTemplateDirectory, { withFileTypes: true })) {
  if (entry.isFile() && /\.(?:md|ya?ml)$/i.test(entry.name)) {
    activePublicFiles.push(`.github/ISSUE_TEMPLATE/${entry.name}`);
  }
}

const forbiddenActivePatterns = [
  ["local file URL", /file:\/\/\/[a-z]:/i],
  ["personal Windows path", /[a-z]:[\\/]users[\\/]/i],
  ["local Tech-Club workspace path", /desktop[\\/]tech-club/i],
  ["stale Semant-iq repository URL", /https:\/\/github\.com\/semant-iq\/semantiq(?:\.git)?/i],
  ["stale Tech-Club organization URL", /https:\/\/github\.com\/tech-club(?:\/|$)/i]
];

const failures = [];
let markdownLinksChecked = 0;
let generatedLinksChecked = 0;

function markdownTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith("<") && trimmed.includes(">")) {
    return trimmed.slice(1, trimmed.indexOf(">"));
  }
  return trimmed.split(/\s+(?=["'])/, 1)[0];
}

function localTargetPath(target) {
  const withoutFragment = target.split("#", 1)[0].split("?", 1)[0];
  try {
    return decodeURIComponent(withoutFragment);
  } catch {
    return withoutFragment;
  }
}

for (const repositoryPath of activePublicFiles) {
  const absolutePath = join(repositoryRoot, repositoryPath);
  if (!existsSync(absolutePath)) {
    failures.push(`${repositoryPath}: active public file is missing`);
    continue;
  }

  const content = readFileSync(absolutePath, "utf8");
  for (const [label, pattern] of forbiddenActivePatterns) {
    if (pattern.test(content)) {
      failures.push(`${repositoryPath}: contains ${label}`);
    }
  }

  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = markdownTarget(match[1]);
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) {
      continue;
    }

    const localTarget = localTargetPath(target);
    if (!localTarget) {
      continue;
    }

    markdownLinksChecked += 1;
    const resolvedTarget = resolve(dirname(absolutePath), localTarget);
    if (!existsSync(resolvedTarget)) {
      failures.push(`${repositoryPath}: missing relative link target ${target}`);
    }
  }
}

function generatedHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...generatedHtmlFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(absolutePath);
    }
  }
  return files;
}

if (!existsSync(generatedDocsRoot) || !statSync(generatedDocsRoot).isDirectory()) {
  failures.push("dist/docs: generated documentation site is missing; run pnpm docs:build first");
} else {
  for (const htmlPath of generatedHtmlFiles(generatedDocsRoot)) {
    const content = readFileSync(htmlPath, "utf8");
    for (const match of content.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const target = match[1];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) {
        continue;
      }

      const localTarget = localTargetPath(target);
      if (!localTarget) {
        continue;
      }

      generatedLinksChecked += 1;
      const resolvedTarget = resolve(dirname(htmlPath), localTarget);
      const expectedTarget = target.endsWith("/")
        ? join(resolvedTarget, "index.html")
        : resolvedTarget;
      if (!existsSync(expectedTarget)) {
        const relativeHtmlPath = htmlPath.slice(repositoryRoot.length + 1);
        failures.push(`${relativeHtmlPath}: broken generated link ${target}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Public documentation validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Public documentation validation passed: ${activePublicFiles.length} active files, ` +
    `${markdownLinksChecked} relative Markdown links, ${generatedLinksChecked} generated links.`
);
