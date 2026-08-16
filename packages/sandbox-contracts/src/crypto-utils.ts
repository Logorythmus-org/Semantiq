/**
 * @package @semantiq/sandbox-contracts
 * Cryptographic & Deterministic Utilities
 */
import { createHash, randomUUID } from "crypto";
import type { EnvironmentSpec, SandboxProvenance, ReproducibilityTier } from "./types.js";

export function computeSha256(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const entries = Object.entries(obj as Record<string, unknown>)
    .filter(([_, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

export function computeSpecHash(spec: EnvironmentSpec): string {
  return `sha256:${computeSha256(canonicalJson(spec))}`;
}

export function computeMerkleRoot(
  fileEntries: readonly { path: string; sha256: string }[]
): string {
  if (fileEntries.length === 0) {
    return `sha256:${computeSha256("")}`;
  }
  const sorted = [...fileEntries].sort((a, b) => a.path.localeCompare(b.path));
  const serialized = sorted.map((e) => `${e.path}:${e.sha256}`).join("\n");
  return `sha256:${computeSha256(serialized)}`;
}

export function generateProvenance(
  spec: EnvironmentSpec,
  providerId: string,
  providerVersion: string,
  adapterVersion: string,
  deterministicSeed = "42",
  tier: ReproducibilityTier = "HERMETIC_DETERMINISTIC"
): SandboxProvenance {
  const specHash = computeSpecHash(spec);
  return {
    provenanceId: randomUUID(),
    specHash,
    providerId,
    providerVersion,
    adapterVersion,
    imageDigest: spec.image.digest,
    hostArchitecture: process.arch === "arm64" ? "aarch64" : "x86_64",
    deterministicSeed,
    recordedAt: new Date().toISOString(),
    reproducibilityTier: tier
  };
}
