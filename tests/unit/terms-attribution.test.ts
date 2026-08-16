import { describe, it, expect } from "vitest";
import {
  ComplianceAttributionCompiler,
  type AttributionNotice,
  type CommercialRestrictionTerms,
  type TrademarkDisclaimer
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Terms, Attribution, and Compliance", () => {
  const compiler = new ComplianceAttributionCompiler();

  const standardNotices: AttributionNotice[] = [
    {
      component: "python-runtime-environment",
      spdxLicense: "Python-2.0",
      copyrightHolders: ["Python Software Foundation"],
      noticeText: "Copyright © 2001-2026 Python Software Foundation. All rights reserved.",
      sourceUrl: "https://python.org"
    },
    {
      component: "swe-bench-scenarios",
      spdxLicense: "MIT",
      copyrightHolders: ["SWE-bench Authors"],
      noticeText: "Copyright (c) 2024 SWE-bench Authors.",
      sourceUrl: "https://github.com/princeton-nlp/SWE-bench"
    }
  ];

  const commercialAllowedTerms: CommercialRestrictionTerms = {
    commercialUseAllowed: true,
    researchOnlyClause: false,
    patentRetaliationClause: false,
    redistributionPermitted: true,
    termsOfServiceUrl: "https://semantiq.dev/terms",
    termsVersion: "1.0.0"
  };

  const researchOnlyTerms: CommercialRestrictionTerms = {
    commercialUseAllowed: false,
    researchOnlyClause: true,
    patentRetaliationClause: false,
    redistributionPermitted: false
  };

  it("compiles full compliance and attribution package with default trademark disclaimers", () => {
    const pkg = compiler.compilePackage(
      "bench-swe-verified",
      "scenario-django-fix",
      "local-docker-oci",
      standardNotices,
      commercialAllowedTerms
    );

    expect(pkg.benchmarkId).toBe("bench-swe-verified");
    expect(pkg.complianceGrade).toBe("COMPLIANT_WITH_NOTICES");
    expect(pkg.notices.length).toBe(2);
    expect(pkg.trademarks.some((t) => t.mark === "Docker")).toBe(true);
    expect(pkg.trademarks.some((t) => t.mark === "Kubernetes")).toBe(true);
    expect(pkg.summaryMarkdown).toContain("Compliance & Attribution Package");
    expect(pkg.summaryMarkdown).toContain("**Commercial Evaluation Allowed**: Yes");
    expect(pkg.summaryMarkdown).toContain("Python Software Foundation");
  });

  it("assigns NON_COMMERCIAL_RESTRICTED grade when research-only clause is present", () => {
    const report = compiler.validateCompliance(standardNotices, researchOnlyTerms);
    expect(report.isCompliant).toBe(true);
    expect(report.grade).toBe("NON_COMMERCIAL_RESTRICTED");
    expect(
      report.warnings.some((w) => w.includes("restricted to academic/non-commercial research"))
    ).toBe(true);
  });

  it("blocks compliance when mandatory notice fields are missing", () => {
    const malformedNotices: AttributionNotice[] = [
      {
        component: "",
        spdxLicense: "",
        copyrightHolders: [],
        noticeText: ""
      }
    ];

    const report = compiler.validateCompliance(malformedNotices, commercialAllowedTerms);
    expect(report.isCompliant).toBe(false);
    expect(report.grade).toBe("NON_COMPLIANT_BLOCKED");
    expect(report.violations.length).toBeGreaterThanOrEqual(2);
  });

  it("supports custom trademark disclaimers alongside defaults", () => {
    const customTrademarks: TrademarkDisclaimer[] = [
      {
        mark: "E2B",
        owner: "E2B Inc",
        usageContext: "Cloud microVM provider identification",
        disclaimerText:
          "E2B is a trademark of E2B Inc. Used nominatively to refer to execution backend."
      }
    ];

    const pkg = compiler.compilePackage(
      "bench-custom",
      "scenario-1",
      "cloud-e2b",
      standardNotices,
      commercialAllowedTerms,
      customTrademarks
    );

    expect(pkg.trademarks.some((t) => t.mark === "E2B")).toBe(true);
    expect(pkg.trademarks.some((t) => t.mark === "Docker")).toBe(true);
  });
});
