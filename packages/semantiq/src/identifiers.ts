import { createHash } from "node:crypto";

export type SemantiqArtifactType =
  | "software-release"
  | "benchmark-pack"
  | "dataset-pack"
  | "evaluation-report"
  | "evidence-bundle"
  | "provider-snapshot"
  | "plugin"
  | "documentation-snapshot";

export interface CreatorRef {
  readonly name: string;
  readonly orcid?: string;
  readonly role?: string;
}

export interface ProvenanceRelations {
  readonly isVersionOf?: string;
  readonly hasVersion?: readonly string[];
  readonly isDerivedFrom?: string;
  readonly documents?: string;
  readonly usesDataset?: readonly string[];
  readonly usesModel?: string;
  readonly generatedBy?: string;
}

export interface RelatedIdentifier {
  readonly identifier: string;
  readonly relationType: string;
}

export interface SemantiqArtifactMetadata {
  readonly artifactId: string;
  readonly artifactType: SemantiqArtifactType;
  readonly title: string;
  readonly version: string;
  readonly createdAt: string;
  readonly releasedAt?: string;
  readonly repositoryUrl: string;
  readonly gitCommit: string;
  readonly gitTag?: string;
  readonly contentHash: string;
  readonly hashAlgorithm: "sha256";
  readonly doi?: string;
  readonly conceptDoi?: string;
  readonly creators: readonly CreatorRef[];
  readonly license: string;
  readonly provenance: ProvenanceRelations;
  readonly relatedIdentifiers?: readonly RelatedIdentifier[];
}

export function computeContentHash(content: unknown): string {
  const normalized = typeof content === "string" ? content : JSON.stringify(content);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function formatArtifactId(type: SemantiqArtifactType, slug: string, versionOrHash: string): string {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return `semantiq:${type}:${cleanSlug}:${versionOrHash}`;
}

export function parseArtifactId(artifactId: string): { type: SemantiqArtifactType; slug: string; versionOrHash: string } {
  const parts = artifactId.split(":");
  if (parts.length < 4 || parts[0] !== "semantiq") {
    throw new Error(`Invalid Semantiq Artifact ID format: ${artifactId}`);
  }
  return {
    type: parts[1] as SemantiqArtifactType,
    slug: parts[2]!,
    versionOrHash: parts.slice(3).join(":")
  };
}

export function validateArtifactMetadata(metadata: SemantiqArtifactMetadata): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];

  if (!metadata.artifactId || !metadata.artifactId.startsWith("semantiq:")) {
    errors.push("artifactId must start with 'semantiq:'");
  }
  if (!metadata.title) errors.push("title is required");
  if (!metadata.version) errors.push("version is required");
  if (!metadata.contentHash || metadata.contentHash.length !== 64) {
    errors.push("contentHash must be a valid 64-character SHA-256 hex digest");
  }
  if (!metadata.creators || metadata.creators.length === 0) {
    errors.push("creators array must contain at least one entry");
  }

  return { valid: errors.length === 0, errors };
}
