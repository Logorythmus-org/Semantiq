import { describe, it, expect } from "vitest";
import { SpisInteroperabilityEngine } from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Provider Interoperability Standard (SPIS)", () => {
  const engine = new SpisInteroperabilityEngine();

  it("negotiates SPIS versions and detects compatibility", () => {
    const supported = ["1.0.0", "1.1.0"];
    const exactMatch = engine.negotiateVersion("1.0.0", supported);
    expect(exactMatch.isCompatible).toBe(true);
    expect(exactMatch.negotiatedVersion).toBe("1.0.0");

    const mismatch = engine.negotiateVersion("2.0.0", supported);
    expect(mismatch.isCompatible).toBe(false);
    expect(mismatch.negotiatedVersion).toBe("1.1.0");
  });

  it("assembles and seals SPIS provider interoperability manifest", () => {
    const manifest = engine.createInteroperabilityManifest(
      "1.0.0",
      "provider-firecracker-generic",
      "SPIS_FULL_OBSERVABLE_L3",
      ["microvm", "container"],
      ["isolated_airgapped", "hermetic_deterministic"],
      ["custom-gpu-tap"],
      "sha256",
      "http://localhost:8080/spis/v1"
    );

    expect(manifest.spisVersion).toBe("1.0.0");
    expect(manifest.providerId).toBe("provider-firecracker-generic");
    expect(manifest.conformanceLevel).toBe("SPIS_FULL_OBSERVABLE_L3");
    expect(manifest.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.certificationSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);

    const isValid = engine.verifyConformance(manifest);
    expect(isValid).toBe(true);
  });

  it("formats comprehensive Markdown SPIS conformance document", () => {
    const manifest = engine.createInteroperabilityManifest(
      "1.0.0",
      "provider-firecracker-generic",
      "SPIS_FULL_OBSERVABLE_L3",
      ["microvm"],
      ["isolated_airgapped"]
    );

    const markdown = engine.formatSpisMarkdown(manifest);

    expect(markdown).toContain(
      "# SemantIQ Provider Interoperability Standard (SPIS) Conformance Manifest"
    );
    expect(markdown).toContain("SPIS_FULL_OBSERVABLE_L3");
    expect(markdown).toContain("Supported Runtime Technologies");
    expect(markdown).toContain("Supported Security & Isolation Profiles");
    expect(markdown).toContain("SPIS Certification Signature");
  });
});
