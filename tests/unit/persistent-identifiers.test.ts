import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeContentHash,
  formatArtifactId,
  parseArtifactId,
  validateArtifactMetadata,
  type SemantiqArtifactMetadata
} from "../../packages/semantiq/src/identifiers.js";

describe("Persistent Identifiers Strategy (Prompt 6.16)", () => {
  it("formats and parses canonical Semantiq Artifact IDs", () => {
    const formatted = formatArtifactId("benchmark-pack", "synthetic-smoke", "v1.0.0");
    expect(formatted).toEqual("semantiq:benchmark-pack:synthetic-smoke:v1.0.0");

    const parsed = parseArtifactId(formatted);
    expect(parsed.type).toEqual("benchmark-pack");
    expect(parsed.slug).toEqual("synthetic-smoke");
    expect(parsed.versionOrHash).toEqual("v1.0.0");
  });

  it("computes deterministic SHA-256 content hashes", () => {
    const content = { title: "Test Subject", value: 42 };
    const hash1 = computeContentHash(content);
    const hash2 = computeContentHash(content);
    expect(hash1).toHaveLength(64);
    expect(hash1).toEqual(hash2);
  });

  it("validates artifact metadata objects", () => {
    const validMeta: SemantiqArtifactMetadata = {
      artifactId: "semantiq:software-release:semantiq-benchmarks:v0.1.0-alpha.1",
      artifactType: "software-release",
      title: "SemantIQ Benchmarks Controlled Public Alpha Release Candidate",
      version: "0.1.0-alpha.1",
      createdAt: "2026-07-31T12:00:00Z",
      repositoryUrl: "https://github.com/tech-club/tech-club",
      gitCommit: "a1b2c3d4e5f67890123456789abcdef012345678",
      contentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      hashAlgorithm: "sha256",
      creators: [{ name: "Core Maintainers" }],
      license: "MIT",
      provenance: {}
    };

    const res = validateArtifactMetadata(validMeta);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("validates example JSON identifier manifests from disk", () => {
    const samplePaths = [
      "examples/identifiers/software-release.json",
      "examples/identifiers/benchmark-pack.json",
      "examples/identifiers/dataset-pack.json",
      "examples/identifiers/evaluation-report.json"
    ];

    for (const path of samplePaths) {
      const jsonStr = readFileSync(path, "utf-8");
      const meta = JSON.parse(jsonStr) as SemantiqArtifactMetadata;
      const res = validateArtifactMetadata(meta);
      expect(res.valid).toBe(true);
    }
  });
});
