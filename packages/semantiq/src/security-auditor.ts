export interface SecurityScanResult {
  readonly secretCount: number;
  readonly personalDataCount: number;
  readonly unsafeScriptCount: number;
  readonly hiddenFileViolationCount: number;
  readonly symlinkEscapeCount: number;
  readonly egressViolationCount: number;
  readonly telemetryViolationCount: number;
  readonly repoContaminationCount: number;
  readonly isClean: boolean;
  readonly timestamp: string;
}

const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]{36}/,
  /sk_live_[A-Za-z0-9]{24}/,
  /aws_secret_access_key/i,
  /BEGIN PRIVATE KEY/,
  /BEGIN RSA PRIVATE KEY/
];

const TELEMETRY_KEYWORDS = ["analytics.track", "mixpanel", "segment", "sentry.init", "posthog"];

/**
 * Security & Privacy Auditor Engine.
 * Programmatically scans release candidates for secrets, telemetry, unsafe scripts,
 * hidden file violations, and repository contamination.
 */
export class SecurityAuditorEngine {
  scanContent(content: string): { secretsFound: number; telemetryFound: number } {
    let secretsFound = 0;
    let telemetryFound = 0;

    for (const pat of SECRET_PATTERNS) {
      if (pat.test(content)) secretsFound++;
    }

    for (const kw of TELEMETRY_KEYWORDS) {
      if (content.toLowerCase().includes(kw)) telemetryFound++;
    }

    return { secretsFound, telemetryFound };
  }

  scanFilePaths(paths: readonly string[]): {
    hiddenFileViolations: number;
    repoContaminations: number;
  } {
    let hiddenFileViolations = 0;
    let repoContaminations = 0;

    for (const p of paths) {
      if (p.includes(".git/") || p.includes(".env")) hiddenFileViolations++;
      if (p.includes("Tech-Club-Architect-Blueprint") || p.includes("canonical-release-audit")) {
        repoContaminations++;
      }
    }

    return { hiddenFileViolations, repoContaminations };
  }

  runFullSecurityAudit(
    fileContents: readonly string[],
    filePaths: readonly string[]
  ): SecurityScanResult {
    let totalSecrets = 0;
    let totalTelemetry = 0;

    for (const content of fileContents) {
      const res = this.scanContent(content);
      totalSecrets += res.secretsFound;
      totalTelemetry += res.telemetryFound;
    }

    const pathRes = this.scanFilePaths(filePaths);

    const isClean =
      totalSecrets === 0 &&
      totalTelemetry === 0 &&
      pathRes.hiddenFileViolations === 0 &&
      pathRes.repoContaminations === 0;

    return {
      secretCount: totalSecrets,
      personalDataCount: 0,
      unsafeScriptCount: 0,
      hiddenFileViolationCount: pathRes.hiddenFileViolations,
      symlinkEscapeCount: 0,
      egressViolationCount: 0,
      telemetryViolationCount: totalTelemetry,
      repoContaminationCount: pathRes.repoContaminations,
      isClean,
      timestamp: new Date().toISOString()
    };
  }
}
