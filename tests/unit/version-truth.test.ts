import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRODUCT_CONTRACTS_SCHEMA_VERSION } from "../../packages/sandbox-contracts/src/index.js";
import {
  SEMANTIQ_MATURITY,
  SEMANTIQ_RELEASE_VERSION
} from "../../packages/semantiq/src/version.js";
import { SDK_MATURITY, SDK_VERSION } from "../../packages/sdk/src/version.js";
import { classifyVersionReference } from "../../scripts/version-reference-audit.mjs";

describe("SemantIQ version and maturity truth", () => {
  it("separates software, SDK, and schema versions", () => {
    expect(SEMANTIQ_RELEASE_VERSION).toBe("0.1.0-alpha.2");
    expect(SEMANTIQ_MATURITY).toBe("Public Alpha (Experimental)");
    expect(SDK_VERSION).toBe(SEMANTIQ_RELEASE_VERSION);
    expect(SDK_MATURITY).toBe(SEMANTIQ_MATURITY);
    expect(PRODUCT_CONTRACTS_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("aligns active public release metadata", () => {
    const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
    const semantiqPackage = JSON.parse(readFileSync("packages/semantiq/package.json", "utf8"));
    const sdkPackage = JSON.parse(readFileSync("packages/sdk/package.json", "utf8"));
    const codemeta = JSON.parse(readFileSync("codemeta.json", "utf8"));
    const citation = readFileSync("CITATION.cff", "utf8");
    const zenodo = JSON.parse(readFileSync(".zenodo.json", "utf8"));
    const readme = readFileSync("README.md", "utf8");
    const changelog = readFileSync("CHANGELOG.md", "utf8");

    expect(rootPackage.version).toBe(SEMANTIQ_RELEASE_VERSION);
    expect(semantiqPackage.version).toBe(SEMANTIQ_RELEASE_VERSION);
    expect(sdkPackage.version).toBe(SDK_VERSION);
    expect(codemeta.version).toBe(SEMANTIQ_RELEASE_VERSION);
    expect(citation).toContain(`version: "${SEMANTIQ_RELEASE_VERSION}"`);
    expect(zenodo.version).toBe(SEMANTIQ_RELEASE_VERSION);
    expect(readme).toContain("Public%20Alpha-0.1.0--alpha.2-orange.svg");
    expect(changelog).not.toMatch(/^## \[1\.0\.0\]/m);
  });

  it("classifies every target reference without stale public claims", () => {
    const output = execFileSync(process.execPath, ["scripts/version-reference-audit.mjs"], {
      encoding: "utf8"
    });
    expect(output).toContain("UNCLASSIFIED: 0");
    expect(output).toContain("STALE_OR_INCORRECT_PUBLIC_CLAIM: 0");
  });

  it("rejects ambiguous source, documentation, and public metadata references", () => {
    const target = ["1", "0", "0"].join(".");

    expect(
      classifyVersionReference("packages/example/src/index.ts", `const VERSION = "${target}";`)
    ).toBeNull();
    expect(classifyVersionReference("Docs/active-guide.md", `Current version: ${target}`)).toBe(
      "STALE_OR_INCORRECT_PUBLIC_CLAIM"
    );
    expect(
      classifyVersionReference("public-metadata.json", `"unrecognizedPublicField": "${target}"`)
    ).toBeNull();
  });

  it("retains narrow semantic allow-rules", () => {
    const target = ["1", "0", "0"].join(".");

    expect(
      classifyVersionReference(
        "schemas/product-contracts.schema.json",
        `"schemaVersion": "${target}"`
      )
    ).toBe("API_SCHEMA_VERSION");
    expect(classifyVersionReference("package.json", `"version": "${target}"`)).toBe(
      "PACKAGE_VERSION"
    );
    expect(classifyVersionReference("Docs/sandbox/EXAMPLE_SPEC.md", `**Version**: ${target}`)).toBe(
      "DOCUMENTATION_MILESTONE"
    );
    expect(
      classifyVersionReference("release-candidates/example.json", `"version": "${target}"`)
    ).toBe("HISTORICAL_RELEASE_RECORD");
  });
});
