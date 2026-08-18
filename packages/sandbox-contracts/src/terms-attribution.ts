/**
 * @package @tech-club/sandbox-contracts
 * Terms, Attribution, NOTICE, Trademarks, and Commercial Compliance Architecture
 */

export type ComplianceGrade =
  | "FULLY_COMPLIANT"
  | "COMPLIANT_WITH_NOTICES"
  | "NON_COMMERCIAL_RESTRICTED"
  | "NON_COMPLIANT_BLOCKED";

export interface AttributionNotice {
  readonly component: string;
  readonly spdxLicense: string;
  readonly copyrightHolders: readonly string[];
  readonly noticeText: string;
  readonly sourceUrl?: string | undefined;
  readonly licenseSha256?: string | undefined;
}

export interface TrademarkDisclaimer {
  readonly mark: string;
  readonly owner: string;
  readonly usageContext: string;
  readonly disclaimerText: string;
}

export interface CommercialRestrictionTerms {
  readonly commercialUseAllowed: boolean;
  readonly researchOnlyClause: boolean;
  readonly patentRetaliationClause: boolean;
  readonly redistributionPermitted: boolean;
  readonly termsOfServiceUrl?: string | undefined;
  readonly termsVersion?: string | undefined;
}

export interface ComplianceAttributionPackage {
  readonly packageId: string;
  readonly benchmarkId: string;
  readonly scenarioId: string;
  readonly providerId: string;
  readonly generatedAt: string;
  readonly notices: readonly AttributionNotice[];
  readonly trademarks: readonly TrademarkDisclaimer[];
  readonly commercialTerms: CommercialRestrictionTerms;
  readonly complianceGrade: ComplianceGrade;
  readonly summaryMarkdown: string;
  readonly packageSignatureHex: string;
}

export interface ComplianceValidationReport {
  readonly isCompliant: boolean;
  readonly grade: ComplianceGrade;
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
  readonly auditedAt: string;
}

/**
 * Compliance Attribution Compiler & Workflow Engine.
 * Automatically aggregates Apache-2.0 NOTICE blocks, SPDX licensing statements,
 * nominative trademark disclaimers, and evaluates commercial usability.
 */
export class ComplianceAttributionCompiler {
  private readonly defaultTrademarkDisclaimers: TrademarkDisclaimer[] = [
    {
      mark: "Docker",
      owner: "Docker, Inc.",
      usageContext: "Container runtime identification",
      disclaimerText:
        "Docker and the Docker logo are trademarks or registered trademarks of Docker, Inc. SemantIQ is an independent evaluation tool with no commercial affiliation."
    },
    {
      mark: "Kubernetes",
      owner: "The Linux Foundation",
      usageContext: "Cluster orchestration identification",
      disclaimerText:
        "Kubernetes is a registered trademark of The Linux Foundation. Used nominatively to refer to execution compatibility."
    }
  ];

  compilePackage(
    benchmarkId: string,
    scenarioId: string,
    providerId: string,
    notices: readonly AttributionNotice[],
    commercialTerms: CommercialRestrictionTerms,
    customTrademarks?: readonly TrademarkDisclaimer[]
  ): ComplianceAttributionPackage {
    const trademarks = [...this.defaultTrademarkDisclaimers, ...(customTrademarks ?? [])];
    const validation = this.validateCompliance(notices, commercialTerms);

    const summaryLines: string[] = [
      `# Compliance & Attribution Package: ${benchmarkId} / ${scenarioId}`,
      `**Provider**: ${providerId}`,
      `**Compliance Grade**: ${validation.grade}`,
      `**Generated**: ${new Date().toISOString()}`,
      "",
      "## 1. Commercial Usability Terms",
      `- **Commercial Evaluation Allowed**: ${commercialTerms.commercialUseAllowed ? "Yes" : "No"}`,
      `- **Research-Only Clause**: ${commercialTerms.researchOnlyClause ? "Active (Restricted to Non-Commercial Research)" : "None"}`,
      `- **Redistribution Permitted**: ${commercialTerms.redistributionPermitted ? "Yes" : "No"}`,
      commercialTerms.termsOfServiceUrl
        ? `- **Terms of Service**: ${commercialTerms.termsOfServiceUrl}`
        : "",
      "",
      "## 2. Third-Party Attribution & NOTICE Blocks"
    ];

    for (const n of notices) {
      summaryLines.push(`### ${n.component} [${n.spdxLicense}]`);
      summaryLines.push(`- **Copyright**: ${n.copyrightHolders.join(", ")}`);
      if (n.sourceUrl) summaryLines.push(`- **Source**: ${n.sourceUrl}`);
      if (n.noticeText && n.noticeText.trim().length > 0) {
        summaryLines.push("```");
        summaryLines.push(n.noticeText.trim());
        summaryLines.push("```");
      }
    }

    summaryLines.push("");
    summaryLines.push("## 3. Nominative Trademark Disclaimers");
    for (const tm of trademarks) {
      summaryLines.push(`- **${tm.mark}** (Owner: ${tm.owner}): ${tm.disclaimerText}`);
    }

    const summaryMarkdown = summaryLines.filter((l) => l !== undefined).join("\n");

    return {
      packageId: `attr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      benchmarkId,
      scenarioId,
      providerId,
      generatedAt: new Date().toISOString(),
      notices,
      trademarks,
      commercialTerms,
      complianceGrade: validation.grade,
      summaryMarkdown,
      packageSignatureHex:
        "3045022100attrpkg0123456789abcdef0123456789abcdef0123456789abcdef0220attrpkg0123456789abcdef0123456789abcdef0123456789abcdef"
    };
  }

  validateCompliance(
    notices: readonly AttributionNotice[],
    commercialTerms: CommercialRestrictionTerms
  ): ComplianceValidationReport {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Notice completeness
    for (const n of notices) {
      if (!n.component || n.component.trim().length === 0) {
        violations.push("Notice entry missing component name.");
      }
      if (!n.spdxLicense || n.spdxLicense.trim().length === 0) {
        violations.push(`Component "${n.component}" missing SPDX license identifier.`);
      }
      if (n.copyrightHolders.length === 0) {
        violations.push(`Component "${n.component}" missing copyright holder attribution.`);
      }
    }

    // 2. Commercial terms evaluation
    let grade: ComplianceGrade = "FULLY_COMPLIANT";

    if (violations.length > 0) {
      grade = "NON_COMPLIANT_BLOCKED";
    } else if (commercialTerms.researchOnlyClause || !commercialTerms.commercialUseAllowed) {
      grade = "NON_COMMERCIAL_RESTRICTED";
      warnings.push("Benchmark is restricted to academic/non-commercial research environments.");
    } else if (notices.length > 0) {
      grade = "COMPLIANT_WITH_NOTICES";
    }

    return {
      isCompliant: violations.length === 0,
      grade,
      violations,
      warnings,
      auditedAt: new Date().toISOString()
    };
  }
}
