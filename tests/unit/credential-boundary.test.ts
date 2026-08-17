import { describe, it, expect } from "vitest";
import {
  SecretRedactor,
  CredentialBoundaryValidator
} from "../../packages/sandbox-contracts/src/credentials.js";
import type { CredentialResolutionContext } from "../../packages/sandbox-contracts/src/credentials.js";

describe("SemantIQ Sandbox Phase — Credential and Secret Boundary", () => {
  it("redacts registered secret values and custom patterns from execution output", () => {
    const redactor = new SecretRedactor();
    const rawSecret = "ghp_exampleTokenSecretString12345678";
    redactor.registerSecret("GITHUB_TOKEN", rawSecret);

    const rawLog = `Cloning repository using token: ${rawSecret} into workspace.`;
    const sanitized = redactor.redact(rawLog);

    expect(sanitized).not.toContain(rawSecret);
    expect(sanitized).toContain("[REDACTED_SECRET:GITHUB_TOKEN]");
  });

  it("audits text and flags direct secrets and generic secret pattern matches", () => {
    const validator = new CredentialBoundaryValidator();
    const testSecret = "sk-abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl";
    const textWithSecret = `Authorization: Bearer ${testSecret}`;

    const report = validator.auditText(textWithSecret, [testSecret]);
    expect(report.isValid).toBe(false);
    expect(report.detectedLeaksCount).toBeGreaterThanOrEqual(1);
    expect(report.violations).toContain("Direct raw secret string detected in payload.");
  });

  it("passes audit when text is clean of secrets and pattern matches", () => {
    const validator = new CredentialBoundaryValidator();
    const cleanText =
      "Cloning repository using token: [REDACTED_SECRET:GITHUB_TOKEN] into workspace.";

    const report = validator.auditText(cleanText, []);
    expect(report.isValid).toBe(true);
    expect(report.detectedLeaksCount).toBe(0);
    expect(report.violations.length).toBe(0);
  });
});
