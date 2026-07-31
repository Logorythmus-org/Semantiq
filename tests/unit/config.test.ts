import { describe, expect, it } from "vitest";
import { ConfigurationError } from "../../packages/shared/src/index.js";
import { loadTechClubConfig, requireConfig } from "../../packages/config/src/index.js";

describe("Tech Club configuration", () => {
  it("loads local defaults without production fallback", () => {
    const config = loadTechClubConfig({});

    expect(config.techclubEnv).toBe("local");
    expect(config.databaseUrl).toContain("localhost");
  });

  it("rejects invalid URL values", () => {
    expect(() => loadTechClubConfig({ DATABASE_URL: "not-a-url" })).toThrow(ConfigurationError);
  });

  it("fails clearly for explicitly required missing values", () => {
    expect(() => requireConfig({}, "TECHCLUB_REQUIRED_TEST_VALUE")).toThrow(
      "Missing required configuration variable"
    );
  });

  it("rejects production mode in the local baseline", () => {
    expect(() => loadTechClubConfig({ NODE_ENV: "production" })).toThrow(
      "Production configuration is intentionally unsupported"
    );
  });
});
