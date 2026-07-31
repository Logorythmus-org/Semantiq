import { describe, expect, it } from "vitest";
import {
  SecretValue,
  diagnoseSettings,
  explainSetting,
  loadTechClubSettings,
  parseEnvFile
} from "../../packages/config/src/index.js";

describe("authoritative runtime settings", () => {
  it("parses env files and applies override precedence", () => {
    expect(parseEnvFile("# comment\nAPI_PORT=3000\nLOG_LEVEL=warn")).toEqual({
      API_PORT: "3000",
      LOG_LEVEL: "warn"
    });
    const settings = loadTechClubSettings({
      values: { TECHCLUB_PROFILE: "development", API_PORT: "3000" },
      files: { API_PORT: "2000" },
      overrides: { API_PORT: "4000" }
    });
    expect(settings.application.port).toBe(4000);
    expect(settings.sources.API_PORT).toBe("override");
  });

  it("supports explicit profiles and rejects unsafe test targets", () => {
    expect(
      loadTechClubSettings({ values: { TECHCLUB_PROFILE: "benchmark" } }).application.profile
    ).toBe("benchmark");
    expect(() =>
      loadTechClubSettings({
        values: { TECHCLUB_PROFILE: "test", DATABASE_URL: "postgresql://localhost/techclub" }
      })
    ).toThrow("Test profile must target a test database");
    expect(() => loadTechClubSettings({ values: { TECHCLUB_PROFILE: "unknown" } })).toThrow(
      "Invalid TECHCLUB_PROFILE"
    );
  });

  it("validates integrations, paths, flags, and AI without network calls", () => {
    const settings = loadTechClubSettings({
      values: {
        LOCAL_AI_PROVIDER: "ollama",
        LOCAL_AI_BASE_URL: "http://localhost:11434",
        FEATURE_FLAGS: "safeMode=true",
        TECHCLUB_DATA_DIR: ".techclub/settings-test"
      }
    });
    expect(settings.ai.enabled).toBe(true);
    expect(settings.featureFlags.values.safeMode).toBe(true);
    expect(() => loadTechClubSettings({ values: { DATA_PATH: "..\\outside" } })).toThrow(
      "escapes TECHCLUB_DATA_DIR"
    );
  });

  it("redacts secrets in diagnostics and explainability", () => {
    const secret = new SecretValue("local-secret");
    expect(String(secret)).toBe("[redacted]");
    const settings = loadTechClubSettings({
      values: { GITHUB_TOKEN: "token-value", GITHUB_INTEGRATION_ENABLED: "true" }
    });
    const diagnostics = diagnoseSettings(settings);
    expect(diagnostics.publicValues.secrets).toEqual({ githubToken: true, openAiApiKey: false });
    expect(explainSetting(settings, "GITHUB_TOKEN").value).toBe("[redacted]");
  });
});
