import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
  /^config\/release-freeze\.json$/,
  /^(?:PHASE_|phase-|release-|canonical-|targeted-|human-governance|clean-room)/i,
  /^Docs\/(?:phase-|releases?\/|reports\/|repository\/|implementation-cycle-1\/|audit\/)/i,
  /^Docs\/.*(?:REPORT|AUDIT|PHASE|COMPLETION|AUTHORIZATION|INCIDENT|READINESS|HANDOFF|PUBLICATION)/
];

const softwareContextPattern =
  /(?:software|release|semantic|git|rootpackage|candidate|distribution)[A-Za-z0-9_-]*Version|(?:software|release)\s+(?:build|identity|version)/i;
const apiSchemaContextPattern =
  /(?:schema|contract|payload|protocol|spec(?:ification)?|artifact|fixture|benchmark|receipt|manifest|api|dsl|format|identifier|profile|provider|adapter|policy|evaluator|toolchain|declaration|scenario|terms|suite|spis|record|model|subject|package)[A-Za-z0-9_-]*Version|(?:schema|contract|payload|protocol|spec(?:ification)?|artifact|fixture|benchmark|receipt|manifest|api|dsl|format|identifier|profile|provider|adapter|policy|evaluator|toolchain|declaration|scenario|terms|suite|spis|record|model|subject|package)\s+(?:version|revision)|(?:version|revision)\s+(?:of|for)\s+(?:a\s+|the\s+)?(?:schema|contract|payload|protocol|spec(?:ification)?|artifact|fixture|benchmark|receipt|manifest|api|dsl|format|identifier|profile|provider|adapter|policy|evaluator|toolchain|declaration|scenario|terms|suite|spis|record|model|subject|package)|\bschema identifier\s+(?:is|remains|must be)\b/i;
const documentationContextPattern =
  /(?:document|documentation|milestone|architecture|policy|guide|catalog)\s+(?:version|milestone)|(?:version|milestone)\s+(?:of|for)\s+(?:a\s+|the\s+)?(?:document|documentation|architecture|policy|guide|catalog)/i;

const knownSchemaPathPatterns = [
  /^schemas\//,
  /^fixtures\//,
  /^packages\/(?:sandbox-contracts|shared)\//,
  /^products\/semantiq\/specs\//,
  /\/migrations\//,
  /\/(?:schemas?|contracts?|fixtures?)\//,
  /(?:schema|contract|fixture|protocol|manifest|receipt|benchmark|artifact)/i
];

const genericVersionDeclarationPattern =
  /(?:^|[,{\s])(?:["']?version["']?|VERSION)\s*[:=]|\bversion\s+(?:is|remains|must be)\b/i;

const versionedDocumentPathPatterns = [
  /^(?:benchmark-integrity|disputes|governance|high-impact|rubrics|self-observation|trust)\/.+\.md$/i,
  /^Docs\/sandbox\/.+\.md$/i,
  /^packages\/sprint[23]-runtime\/prompts\/.+\.v1\.md$/i,
  /^Docs\/architecture\/dual-language-sdk-strategy\.md$/i
];

const explicitDocumentVersionDeclarationPattern =
  /^\s*(?:\*\*)?(?:Document\s+)?Version(?:\*\*)?\s*:\s*[`"']?1\.0\.0\b/i;

const explicitMilestoneDeclarationPattern =
  /(?:\*\*)?Milestone(?:\*\*)?\s*:\s*.*\b1\.0\.0\b|\b1\.0\.0\b\s+(?:documentation|document|contract)\s+milestone\b/i;

const recordVersionFieldPattern = /(?:["']?version["']?)\s*:/i;
const recordVersionAssignmentPattern = /\bversion\s*=/i;
const recognizedRecordContextPattern =
  /\b(?:agent|application|artifact|asset|backend|benchmark|capability|case|catalog|claim|collection|community|compatibility|configuration|conflict|contract|dataset|decision|dependency|entity|evidence|execution|export|fact|federation|finding|fixture|goal|governance|graph|health|history|hypothesis|identifier|integrity|knowledge|license|manifest|marketplace|memory|metadata|migration|model|node|object|observation|organization|package|pattern|permission|policy|principle|profile|project|protocol|provider|publication|question|record|relation|report|research|resource|risk|rubric|run|scenario|schema|service|source|stage|state|subject|summary|task|taxonomy|tool|trace|trust|verb|visibility|workflow|workspace)[A-Za-z0-9_]*\b/i;
const apiSchemaOperationPattern =
  /\b(?:approveProfile|createInteroperabilityManifest|detectConflict|evaluateCertification|evaluateReleaseGate|execute(?:Architecture|Economic|Phase)Audit|formatArtifactId|generateCompletionReport|negotiateVersion|verifyReproducibility|EvidenceDecisionPolicy|StudyProtocol|ResearchBundleManifest)\b/i;
const artifactIdentifierPattern =
  /\bsemantiq:(?:benchmark-pack|dataset-pack|evidence-bundle|evaluation-report):[^\s`"']*:v?1\.0\.0\b/i;
const historicalSandboxTagPattern = /\bv1\.0\.0-sandbox\b/i;
const versioningPolicyDeclarationPattern =
  /\bVersioning Policy\b.*\bSemantic versioning\b.*\b1\.0\.0\b/i;
const explicitApiCompatibilityPattern =
  /\b(?:client\.version|json\.meta\.version|options\.version|versionTag|version_tag|versionHistory|toolVersions|protocolCompatibility|supportedVersions|negotiatedVersion|versionOrHash|profile\.version|statementText|immutableSnapshotHash|changelog|schema 1\.0\.0|canonical JSON schemas|product-contracts\.schema\.json|SemantIQ Benchmarks v1\.0\.0|Governance evidence specification v1\.0\.0)\b/i;
const claimLifecycleFixturePattern =
  /\b(?:active claim|Draft valid claim|Release v?1\.\d+\.\d+ (?:to|->))/i;
const packageDependencyContextPattern =
  /(?:["']@?semantiq(?:\/[^"']+)?["']\s*:\s*["']\^?1\.0\.0|\bpackages\s*=\s*\{[^}]*["']semantiq["']\s*:\s*["']1\.0\.0|\bdependencies\b[\s\S]*["']\^1\.0\.0)/i;
const documentationFormatReferencePattern =
  /keepachangelog\.com\/en\/1\.0\.0|\bTag Baseline Sealed\b|\bBreaking Contract Changes\b/i;
const versionModelExplanationPattern =
  /\b(?:Classification of|does not claim|without authoritative|Document and specification headers|belongs in this category)\b[\s\S]*\b1\.0\.0\b|\b1\.0\.0\b[\s\S]*\b(?:does not claim|without authoritative|document or specification|belongs in this category)\b/i;
const softwareFingerprintOperationPattern =
  /\bgenerateProvenance\s*\([\s\S]*\b1\.0\.0\b[\s\S]*\badapterVersion\b/i;

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

function isKnownSchemaPath(path) {
  return knownSchemaPathPatterns.some((pattern) => pattern.test(path));
}

function isVersionedDocumentPath(path) {
  return versionedDocumentPathPatterns.some((pattern) => pattern.test(path));
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
    /\.md$/i.test(path) &&
    /\bcurrent\s+(?:software\s+|release\s+)?version\s*[:=]\s*[`"']?1\.0\.0\b/i.test(text)
  ) {
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

export function classifyVersionReference(
  path,
  text,
  column = text.indexOf(targetVersion),
  semanticContext = text
) {
  if (isKnownStalePublicClaim(path, text)) {
    return "STALE_OR_INCORRECT_PUBLIC_CLAIM";
  }
  if (historicalSandboxTagPattern.test(text)) {
    return "HISTORICAL_RELEASE_RECORD";
  }
  if (isHistoricalPath(path)) {
    return "HISTORICAL_RELEASE_RECORD";
  }
  if (isPackageVersion(path, text)) {
    return "PACKAGE_VERSION";
  }

  const left = Math.max(0, column - 80);
  const right = Math.min(text.length, column + targetVersion.length + 80);
  const localContext = text.slice(left, right);
  const context = `${localContext}\n${semanticContext}`;

  if (packageDependencyContextPattern.test(context)) {
    return "PACKAGE_VERSION";
  }

  if (
    /software-release\.json$/.test(path) ||
    softwareContextPattern.test(localContext) ||
    softwareFingerprintOperationPattern.test(context)
  ) {
    return "SOFTWARE_RELEASE_VERSION";
  }
  if (path === "CHANGELOG.md" && /milestone/i.test(text)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (path === "CHANGELOG.md" && /documentation and contract/i.test(context)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (explicitMilestoneDeclarationPattern.test(context)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (versioningPolicyDeclarationPattern.test(context)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (
    path === "governance/constitutional-principles.json" &&
    recordVersionFieldPattern.test(text) &&
    /\bprinciples\b/i.test(context)
  ) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (
    documentationFormatReferencePattern.test(context) ||
    versionModelExplanationPattern.test(context)
  ) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (isVersionedDocumentPath(path) && explicitDocumentVersionDeclarationPattern.test(text)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (apiSchemaContextPattern.test(localContext)) {
    return "API_SCHEMA_VERSION";
  }
  if (
    artifactIdentifierPattern.test(context) ||
    apiSchemaOperationPattern.test(context) ||
    explicitApiCompatibilityPattern.test(context) ||
    claimLifecycleFixturePattern.test(context)
  ) {
    return "API_SCHEMA_VERSION";
  }
  if (recordVersionFieldPattern.test(text) && recognizedRecordContextPattern.test(context)) {
    return "API_SCHEMA_VERSION";
  }
  if (recordVersionAssignmentPattern.test(text) && recognizedRecordContextPattern.test(context)) {
    return "API_SCHEMA_VERSION";
  }
  if (
    isKnownSchemaPath(path) &&
    (genericVersionDeclarationPattern.test(context) || /\$id|const|enum/i.test(context))
  ) {
    return "API_SCHEMA_VERSION";
  }
  if (documentationContextPattern.test(localContext)) {
    return "DOCUMENTATION_MILESTONE";
  }
  if (/^\.env(?:\.|$)/.test(path) && /(?:APP|RELEASE|SOFTWARE)_VERSION/.test(text)) {
    return "SOFTWARE_RELEASE_VERSION";
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
  const fileLines = new Map();

  for (const rawLine of output.split(/\r?\n/)) {
    if (!rawLine) continue;
    const match = rawLine.match(/^(.+?):(\d+):(.*)$/);
    if (!match) continue;
    const [, path, lineText, text] = match;
    let lines = fileLines.get(path);
    if (!lines) {
      lines = readFileSync(path, "utf8").split(/\r?\n/);
      fileLines.set(path, lines);
    }
    const lineNumber = Number(lineText);
    const semanticContext = lines
      .slice(Math.max(0, lineNumber - 7), Math.min(lines.length, lineNumber + 5))
      .join("\n");
    occurrencePattern.lastIndex = 0;
    for (const occurrence of text.matchAll(occurrencePattern)) {
      const column = occurrence.index ?? 0;
      const classification = classifyVersionReference(path, text, column, semanticContext);
      const record = {
        path,
        line: lineNumber,
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
