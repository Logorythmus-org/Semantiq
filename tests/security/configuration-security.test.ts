import { describe, expect, it } from "vitest";
import { diagnoseSettings, loadTechClubSettings } from "../../packages/config/src/index.js";

describe("configuration security regressions", () => {
  it("does not expose provider keys in diagnostics", () => {
    const settings = loadTechClubSettings({
      values: { GITHUB_TOKEN: "real-looking-local-token", GITHUB_INTEGRATION_ENABLED: "true" }
    });
    const output = JSON.stringify(diagnoseSettings(settings));
    expect(output).not.toContain("real-looking-local-token");
    expect(output).toContain("githubToken");
  });
  it("rejects paths outside the configured data root", () => {
    expect(() =>
      loadTechClubSettings({ values: { TECHCLUB_DATA_DIR: ".techclub/test", UPLOADS_PATH: ".." } })
    ).toThrow("escapes TECHCLUB_DATA_DIR");
  });
  it("keeps optional AI disabled without network access", () => {
    expect(loadTechClubSettings().ai).toMatchObject({
      provider: "disabled",
      enabled: false,
      localOnly: true
    });
  });
});
