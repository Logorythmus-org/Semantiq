import { describe, it, expect } from "vitest";
import {
  evaluatePermission,
  detectPermissionDrift,
  redactSecrets
} from "../../packages/semantiq/src/environment-permissions.js";
import type {
  PermissionGrant,
  EnvironmentManifest,
  EnvironmentSnapshot
} from "../../packages/semantiq/src/environment-permissions.js";

describe("Environment and Permission Observation Model (Prompt 8.4)", () => {
  it("enforces default deny when grant is missing", () => {
    const res = evaluatePermission(undefined, "read", "/tmp/file", "2026-08-01T09:00:00Z");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("DEFAULT DENY");
  });

  it("rejects write/execute requests on read-only resources", () => {
    const grant: PermissionGrant = {
      id: "g_001",
      resourceId: "res_file",
      state: "read_only",
      scope: { allowedPathsOrUrls: ["/tmp/"] },
      grantedAt: "2026-08-01T08:00:00Z",
      requiresHumanApproval: false
    };

    const readRes = evaluatePermission(grant, "read", "/tmp/file.txt", "2026-08-01T09:00:00Z");
    expect(readRes.allowed).toBe(true);

    const writeRes = evaluatePermission(grant, "write", "/tmp/file.txt", "2026-08-01T09:00:00Z");
    expect(writeRes.allowed).toBe(false);
    expect(writeRes.reason).toContain("READ ONLY VIOLATION");
  });

  it("detects expired permission grants", () => {
    const grant: PermissionGrant = {
      id: "g_002",
      resourceId: "res_tmp",
      state: "write",
      scope: { allowedPathsOrUrls: ["/tmp/"] },
      grantedAt: "2026-08-01T08:00:00Z",
      expiresAt: "2026-08-01T08:30:00Z",
      requiresHumanApproval: false
    };

    const res = evaluatePermission(grant, "write", "/tmp/file.txt", "2026-08-01T09:00:00Z");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("EXPIRED GRANT");
  });

  it("detects scope escape violations", () => {
    const grant: PermissionGrant = {
      id: "g_003",
      resourceId: "res_scoped",
      state: "write",
      scope: { allowedPathsOrUrls: ["/app/workspace/"] },
      grantedAt: "2026-08-01T08:00:00Z",
      requiresHumanApproval: false
    };

    const res = evaluatePermission(grant, "write", "/etc/passwd", "2026-08-01T09:00:00Z");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("SCOPE ESCAPE VIOLATION");
  });

  it("redacts GitHub PAT tokens and sensitive secrets from logs", () => {
    const rawLog =
      "Connecting with ghp_mockDummyExampleTokenSecret1234567890 and Bearer secret_jwt_token_123";
    const redacted = redactSecrets(rawLog, ["secret_jwt_token_123"]);
    expect(redacted).not.toContain("ghp_mockDummyExampleTokenSecret1234567890");
    expect(redacted).toContain("[REDACTED_GITHUB_PAT]");
    expect(redacted).toContain("[REDACTED_SECRET]");
  });

  it("detects permission drift between initial manifest and runtime snapshot", () => {
    const manifest: EnvironmentManifest = {
      manifestId: "man_001",
      version: "1.0.0",
      targetOS: "windows",
      declaredResources: [
        {
          id: "res_db",
          resourceClass: "database",
          pathOrEndpoint: "localhost:5432",
          isDeclaredInSpec: true
        }
      ],
      initialGrants: [
        {
          id: "g_db",
          resourceId: "res_db",
          state: "read_only",
          scope: { allowedPathsOrUrls: [] },
          grantedAt: "2026-08-01T08:00:00Z",
          requiresHumanApproval: false
        }
      ],
      boundary: {
        id: "b_001",
        isSandboxed: true,
        allowedDomainPatterns: [],
        rootDirectory: "/app",
        maxProcessMemoryMb: 512
      }
    };

    const snapshot: EnvironmentSnapshot = {
      snapshotId: "snap_001",
      timestamp: "2026-08-01T09:00:00Z",
      resources: [
        {
          id: "res_db",
          resourceClass: "database",
          pathOrEndpoint: "localhost:5432",
          isDeclaredInSpec: true
        }
      ],
      grants: [
        {
          id: "g_db",
          resourceId: "res_db",
          state: "write",
          scope: { allowedPathsOrUrls: [] },
          grantedAt: "2026-08-01T08:00:00Z",
          requiresHumanApproval: false
        }
      ],
      boundary: manifest.boundary
    };

    const drift = detectPermissionDrift(manifest, snapshot);
    expect(drift.isDriftDetected).toBe(true);
    expect(drift.modifiedGrants).toContain("g_db");
  });
});
