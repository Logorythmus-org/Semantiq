import { describe, it, expect } from "vitest";
import { ReproducibilityAuditorEngine } from "../../packages/semantiq/src/reproducibility-auditor.js";

describe("Reproducibility, SBOM, and Artifact Integrity (Prompt 11.14)", () => {
  const engine = new ReproducibilityAuditorEngine();

  it("generates valid CycloneDX-1.5 SBOM metadata", () => {
    const sbom = engine.generateSbom("@semantiq/semantiq@0.1.0-alpha.1", [
      {
        name: "typescript",
        version: "5.4.0",
        spdxLicense: "Apache-2.0",
        supplier: "Microsoft Corporation",
        checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    ]);

    expect(sbom.specVersion).toBe("CycloneDX-1.5");
    expect(sbom.rootPackage).toBe("@semantiq/semantiq@0.1.0-alpha.1");
    expect(sbom.packages.length).toBe(1);
  });

  it("verifies 100% reproducible candidate run", () => {
    const report = engine.verifyReproducibility("1.0.0", "c39f221", 48, 0);
    expect(report.isReproducible).toBe(true);
    expect(report.checksumMismatchCount).toBe(0);
    expect(report.totalFilesChecked).toBe(48);
  });
});
