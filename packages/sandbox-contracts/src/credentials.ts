/**
 * @package @tech-club/sandbox-contracts
 * Credential and Secret Boundary Specifications and Interfaces
 */

export type SecretReferenceSource =
  "env_var" | "file_mount" | "vault_ref" | "ephemeral_token" | "synthetic_mock";
export type SecretInjectionTarget = "env" | "tmpfs_file" | "stdin_pipe";

export interface SecretRequirement {
  readonly secretKey: string;
  readonly targetName: string;
  readonly injectionTarget: SecretInjectionTarget;
  readonly source: SecretReferenceSource;
  readonly sourcePathOrEnv?: string | undefined;
  readonly isOptional: boolean;
  readonly isSyntheticMockAllowed: boolean;
  readonly redactionPattern?: string | undefined;
  readonly description: string;
}

export interface SecretDescriptor {
  readonly secretKey: string;
  readonly targetName: string;
  readonly injectionTarget: SecretInjectionTarget;
  readonly isProvided: boolean;
  readonly valueMaskedSha256?: string | undefined; // HMAC or SHA256 of value for provenance without leaking plaintext
}

export interface CredentialResolutionContext {
  readonly benchmarkId: string;
  readonly instanceId: string;
  readonly allowedSourceTypes: readonly SecretReferenceSource[];
  readonly allowSyntheticMocks: boolean;
}

export interface ICredentialResolver {
  resolveSecret(
    requirement: SecretRequirement,
    context: CredentialResolutionContext
  ): Promise<ResolvedSecret | null>;
}

export interface ResolvedSecret {
  readonly secretKey: string;
  readonly targetName: string;
  readonly injectionTarget: SecretInjectionTarget;
  readonly rawValue: string;
  readonly valueMaskedSha256: string;
  readonly redactionPatterns: readonly string[];
}

export interface InjectedSecretSummary {
  readonly secretKey: string;
  readonly targetName: string;
  readonly injectionTarget: SecretInjectionTarget;
  readonly maskedHash: string;
  readonly injectedAt: string;
}

export interface CredentialBoundaryAuditReport {
  readonly isValid: boolean;
  readonly detectedLeaksCount: number;
  readonly violations: readonly string[];
  readonly auditTimestamp: string;
}

/**
 * Secret Redaction Engine.
 * Sanitizes stdout, stderr, file diffs, and execution traces by replacing
 * known secret values and patterns with [REDACTED_SECRET:<KEY>].
 */
export class SecretRedactor {
  private readonly patterns: Map<string, RegExp> = new Map();

  registerSecret(secretKey: string, rawValue: string, customPattern?: string | undefined): void {
    if (!rawValue || rawValue.trim().length === 0) return;

    // Escape special regex characters in the raw value
    const escaped = rawValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    this.patterns.set(secretKey, new RegExp(escaped, "g"));

    if (customPattern) {
      this.patterns.set(`${secretKey}_custom`, new RegExp(customPattern, "g"));
    }
  }

  redact(text: string): string {
    let sanitized = text;
    for (const [key, regex] of this.patterns.entries()) {
      sanitized = sanitized.replace(regex, `[REDACTED_SECRET:${key}]`);
    }
    return sanitized;
  }
}

/**
 * Credential Boundary Validator.
 * Verifies that EnvironmentSpec, ExecutionResult, and StateDelta do not contain
 * plain-text secret patterns or unauthorized secret references.
 */
export class CredentialBoundaryValidator {
  private readonly genericSecretPatterns = [
    /ghp_[a-zA-Z0-9]{36}/,
    /github_pat_[a-zA-Z0-9_]{82}/,
    /sk-[a-zA-Z0-9]{48}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/
  ];

  auditText(text: string, knownSecrets: readonly string[] = []): CredentialBoundaryAuditReport {
    const violations: string[] = [];

    // Check known secret values
    for (const secret of knownSecrets) {
      if (secret && secret.length >= 6 && text.includes(secret)) {
        violations.push("Direct raw secret string detected in payload.");
      }
    }

    // Check generic secret patterns
    for (const pattern of this.genericSecretPatterns) {
      if (pattern.test(text)) {
        violations.push(
          `Pattern match detected for potential secret format: ${pattern.toString()}`
        );
      }
    }

    return {
      isValid: violations.length === 0,
      detectedLeaksCount: violations.length,
      violations,
      auditTimestamp: new Date().toISOString()
    };
  }
}
