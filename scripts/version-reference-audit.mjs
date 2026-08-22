import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const VERSION_REFERENCE_CATEGORIES = Object.freeze([
  "SOFTWARE_RELEASE_VERSION",
  "PACKAGE_VERSION",
  "API_SCHEMA_VERSION",
  "DOCUMENTATION_MILESTONE",
  "HISTORICAL_RELEASE_RECORD",
  "STALE_OR_INCORRECT_PUBLIC_CLAIM"
]);

const targetVersion = ["1", "0", "0"].join(".");
const occurrencePattern = new RegExp(`(?<!\\d)${targetVersion.replaceAll(".", "\\.")}(?!\\d)`, "g");

const historicalPathPatterns = [
  /^release-candidates\//,
  /^release-simulation\//,
  /^semantiq-preservation-private\//,
  /^(?:PHASE_|phase-|release-|canonical-|targeted-|human-governance|clean-room)/i,
  /^Docs\/(?:phase-|release\/|reports\/|repository\/|implementation-cycle-1\/|audit\/)/i,
  /^Docs\/.*(?:REPORT|AUDIT|PHASE|COMPLETION|AUTHORIZATION|INCIDENT|READINESS|HANDOFF|PUBLICATION)/
];

const softwareContextPattern =
  /(?:software|release|semantic|git|rootpackage|candidate|distribution)[A-Za-z_-]*Version|(?:software|release)\s+(?:build|identity|version)/i;
const apiSchemaContextPattern =
  /schema|contract|payload|protocol|spec(?:ification)?|artifact|fixture|benchmark|receipt|manifest|api|dsl|format|identifier|profile/i;
const documentationContextPattern =
  /document|documentation|milestone|architecture|policy|guide|catalog/i;

function isHistoricalPath(path) {
  return historicalPathPatterns.some((pattern) => pattern.test(path));
}

function isPackageVersion(path, text) {
  return (
    /(?:^|\/)package\.json$/.test(path) ||
    path === "pnpm-lock.yaml" ||
    /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock)$/.test(path) ||
    (/SBOM/i.test(path) && /package|dependency|component|version/i.test(text))
  );
}

function isKnownStalePublicClaim(path, text) {
  if (path === "README.md" && /badge\/(?:Version|version)-1\.0\.0|Version:\s*1\.0\.0/.test(text)) {
    return true;
  }
  if (/^(?:CITATION\.cff|codemeta\.json|\.zenodo\.json)$/.test(path)) {
    return /^\s*(?:version:|"version"\s*:)/.test(text) && text.includes(targetVersion);
  }
  if (path === "CHANGELOG.md" && /^##\s+\[1\.0\.0\]/.test(text)) {
    return true;
  }
  if (
    path === "Docs/VERSIONING_POLICY.md" &&
    /\|.*(?:Evidence & Governance Engine|Application Services & Server|TypeScript SDK|Python Package).*\|.*1\.0\.0.*\|.*STABLE/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

function classifyOccurrence(path, text, column) {
  if (isKnownStalePublicClaim(path, text)) {
    return "STALE_OR_INCORRECT_PUBLIC_CLAIM";
  }
  if (isHistoricalPath(path)) {
    return "HISTORICAL_RELEASE_RECORD";
  }
  if (isPackageVersion(path, text)) {
    return "PACKAGE_VERSION";
  }

  const left = Math.max(0, column - 80);
  const right = Math.min(text.length, column + targetVersion.length + 80);
  const context = text.slice(left, right);

  if (/software-release\.json$/.test(path) || softwareContextPattern.test(context)) {
    return "SOFTWARE_RELEASE_VERSION";
  }
  if (path === "CHANGELOG.md" && /milestone/i.test(text)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (apiSchemaContextPattern.test(context)) {
    return "API_SCHEMA_VERSION";
  }
  if (/^Docs\//.test(path) || /\.md$/i.test(path) || documentationContextPattern.test(context)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (
    /^(?:packages|services|apps|tests|fixtures|schemas|products|examples|tools|scripts)\//.test(
      path
    )
  ) {
    return "API_SCHEMA_VERSION";
  }
  if (/^\.github\//.test(path)) {
    return "PACKAGE_VERSION";
  }
  if (/^\.env(?:\.|$)/.test(path) && /(?:APP|RELEASE|SOFTWARE)_VERSION/.test(text)) {
    return "SOFTWARE_RELEASE_VERSION";
  }
  if (/\.(?:json|ya?ml|ts|tsx|js|mjs|py)$/i.test(path)) {
    return "API_SCHEMA_VERSION";
  }
  return null;
}

export function auditVersionReferences() {
  let output = "";
  try {
    output = execFileSync("git", ["grep", "-n", "-I", "-F", targetVersion, "--"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    if (error?.status !== 1) throw error;
  }

  const records = [];
  const unclassified = [];

  for (const rawLine of output.split(/\r?\n/)) {
    if (!rawLine) continue;
    const match = rawLine.match(/^(.+?):(\d+):(.*)$/);
    if (!match) continue;
    const [, path, lineText, text] = match;
    occurrencePattern.lastIndex = 0;
    for (const occurrence of text.matchAll(occurrencePattern)) {
      const column = occurrence.index ?? 0;
      const classification = classifyOccurrence(path, text, column);
      const record = {
        path,
        line: Number(lineText),
        column: column + 1,
        classification,
        text: text.trim()
      };
      records.push(record);
      if (!classification) unclassified.push(record);
    }
  }

  const counts = Object.fromEntries(VERSION_REFERENCE_CATEGORIES.map((category) => [category, 0]));
  for (const record of records) {
    if (record.classification) counts[record.classification] += 1;
  }
  return { targetVersion, occurrences: records.length, counts, unclassified, records };
}

function runCli() {
  const report = auditVersionReferences();
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    console.log(
      `Version reference audit: ${report.occurrences} occurrences of ${report.targetVersion}`
    );
    for (const category of VERSION_REFERENCE_CATEGORIES) {
      console.log(`${category}: ${report.counts[category]}`);
    }
    console.log(`UNCLASSIFIED: ${report.unclassified.length}`);
  }

  if (report.unclassified.length > 0 || report.counts.STALE_OR_INCORRECT_PUBLIC_CLAIM > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli();
}
